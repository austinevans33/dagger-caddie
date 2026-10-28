// Actual Chromium UI; local fake backend, never hosted Firebase certification.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/sunday');fs.mkdirSync(out,{recursive:true});
const docs=new Map(),operations=[],checks=[],errors=[];
const check=(name,value)=>{checks.push({name,pass:!!value});assert.ok(value,name);};
const appSDK=`const apps=[];export const initializeApp=()=>apps[0]||(apps[0]={});export const getApps=()=>apps;`;
const authSDK=`
const listeners=new Set();
const make=u=>u?{...u,getIdToken:async()=> 'LOCAL-FAKE-TOKEN'}:null;
const auth={currentUser:make(JSON.parse(localStorage.getItem('qaIdentity')||'null')),authStateReady:async()=>{}};
window.__qaSetUser=(uid,anonymous=false)=>{auth.currentUser=make(uid?{uid,isAnonymous:anonymous,email:anonymous?null:'qa@example.test'}:null);localStorage.setItem('qaIdentity',JSON.stringify(auth.currentUser));listeners.forEach(fn=>fn(auth.currentUser));};
export const getAuth=()=>auth;
export const onAuthStateChanged=(_,fn)=>{listeners.add(fn);queueMicrotask(()=>fn(auth.currentUser));return()=>listeners.delete(fn);};
export const setPersistence=async()=>{};export const browserLocalPersistence={};
let pending;
export const signInAnonymously=async()=>{if(localStorage.getItem('qaRestricted'))throw Object.assign(Error('Guest signup blocked'),{code:'auth/admin-restricted-operation'});if(auth.currentUser)return{user:auth.currentUser};if(!pending)pending=Promise.resolve().then(()=>{window.__qaSetUser('guest-'+crypto.randomUUID(),true);return{user:auth.currentUser};}).finally(()=>pending=null);return pending;};
export const signInWithEmailAndPassword=async()=>{window.__qaSetUser('host-member');return{user:auth.currentUser};};
export const EmailAuthProvider={credential:()=>({})};export const linkWithCredential=async()=>{window.__qaSetUser(auth.currentUser.uid);return{user:auth.currentUser};};
`;
const firestoreSDK=`
export const getFirestore=()=>({});export const doc=(_, ...parts)=>parts.join('/');export const serverTimestamp=()=>Date.now();
async function op(kind,ref,data){const uid=JSON.parse(localStorage.getItem('qaIdentity')||'null')?.uid;const response=await fetch('/__qa/db',{method:'POST',body:JSON.stringify({kind,ref,data,uid})});const result=await response.json();if(result.error)throw Object.assign(Error(result.error),{code:'permission-denied'});return result;}
export const getDoc=async ref=>{const x=await op('get',ref);return{exists:()=>x.exists,data:()=>x.data};};
export const setDoc=async(ref,data)=>op('set',ref,data);export const updateDoc=async(ref,data)=>op('update',ref,data);
export const runTransaction=async(_,fn)=>fn({get:getDoc,set:setDoc,update:updateDoc});
export const onSnapshot=(ref,next,error)=>{let alive=true,busy=false,last='';async function poll(){if(!alive||busy)return;busy=true;try{const x=await getDoc(ref);const value=JSON.stringify({exists:x.exists(),data:x.data()});if(alive&&value!==last){last=value;next(x);}}catch(e){if(alive)error(e);}finally{busy=false;}}poll();const timer=setInterval(poll,90);return()=>{alive=false;clearInterval(timer);};};
`;
const server=http.createServer(async(req,res)=>{
 if(req.url==='/__qa/db'){
  let body='';for await(const chunk of req)body+=chunk;const x=JSON.parse(body);operations.push(x);let result={};
  const parts=x.ref.split('/'),room=docs.get(parts.slice(0,2).join('/')),member=docs.get(parts.slice(0,2).join('/')+'/members/'+x.uid);
  if(parts[0]==='rooms'){
   if(!x.uid)result={error:'Unauthenticated'};
   else if(parts.length===4){
    if(x.kind==='get')result={error:'Membership pre-read deliberately denied'};
    else if(parts[3]!==x.uid||!room||x.data.uid!==x.uid||x.data.invite!==room.invite)result={error:'Invalid invitation'};
    else docs.set(x.ref,structuredClone(x.data));
   }else if(x.kind==='get'){
    if(!room||room.hostUid!==x.uid&&!member)result={error:'Room access denied'};
    else result={exists:true,data:room};
   }else if(x.kind==='set'){
    if(x.data.hostUid!==x.uid||room)result={error:'Host required'};else docs.set(x.ref,structuredClone(x.data));
   }else if(room?.hostUid!==x.uid||room.archived)result={error:'Host required'};
   else docs.set(x.ref,{...room,...x.data});
  }else if(x.kind==='get')result={exists:docs.has(x.ref),data:docs.get(x.ref)};
  else docs.set(x.ref,{...docs.get(x.ref),...x.data});
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));return;
 }
 const url=new URL(req.url,'http://localhost');let relative=decodeURIComponent(url.pathname),source=path.join(root,'staging-app');
 if(relative.startsWith('/__baseline/')){source=path.resolve(root,'../inspection/r177');relative=relative.slice('/__baseline'.length);}
 const file=path.resolve(source,'.'+(relative==='/'?'/index.html':relative));
 if(!file.startsWith(source+path.sep)||!fs.existsSync(file)){res.statusCode=404;res.end('Missing');return;}
 const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:path.resolve(root,'../browser-tools/chromium-renderer'),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote']});
 async function makePage({restricted=false,width=390}={}){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
  await context.addInitScript(({restricted})=>{Math.random=()=>0.25;if(restricted)localStorage.setItem('qaRestricted','1');},{restricted});
  await context.route('**/*',async route=>{const u=new URL(route.request().url());
   if(u.hostname==='www.gstatic.com'){const name=u.pathname.split('/').pop();const text={'firebase-app.js':appSDK,'firebase-auth.js':authSDK,'firebase-firestore.js':firestoreSDK}[name];if(text)return route.fulfill({contentType:'text/javascript',body:text});}
   if(u.origin===origin)return route.continue();return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());return page;
 }
 async function ready(page,url=origin){await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#manualclub')?.children.length>0);await page.waitForSelector('.dcc-r162-seal-footer',{state:'attached'});}
 async function reveal(page,id){
  const tab=await page.locator('#'+id).evaluate(e=>e.closest('[data-tab]')?.dataset.tab);
  if(tab)await page.locator('#tab-'+tab).click();
  const ancestors=page.locator('#'+id).locator('xpath=ancestor::details');
  for(const detail of await ancestors.all())if(!await detail.evaluate(e=>e.open))await detail.locator(':scope > summary').click();
 }
 try{
  // Compare original R177 and candidate on the same browser, SDK fixture and font stack.
  for(const width of [320,390,430]){
   const a=await makePage({width}),b=await makePage({width});await ready(a,origin+'/__baseline/');await ready(b);
   for(const tab of ['play','games','bets','bag','settings']){
    await a.locator('#tab-'+tab).click();await b.locator('#tab-'+tab).click();
    const selectors={games:'#dccR161Seal_games',bets:'#clubRecordsSection'};
    const selector=selectors[tab]||'[data-tab="'+tab+'"]:not(.hidden-panel)';
    const ac=a.locator(selector).first(),bc=b.locator(selector).first();
    const boxA=await ac.boundingBox(),boxB=await bc.boundingBox();
    if(JSON.stringify(boxA)!==JSON.stringify(boxB))console.log({width,tab,boxA,boxB});check(`${width}px ${tab}: existing region dimensions and position preserved`,JSON.stringify(boxA)===JSON.stringify(boxB));
    if(tab==='games'||tab==='bets'){
     const imgA=await ac.screenshot({animations:'disabled'}),imgB=await bc.screenshot({animations:'disabled'});
     check(`${width}px ${tab}: approved record/seal pixels unchanged`,imgA.equals(imgB));
    }
    if(width===390)await b.screenshot({path:path.join(out,tab+'-390.png'),fullPage:true});
   }
   check(`${width}px rejected global membership banner absent`,await b.locator('#dccMemberIndicator').count()===0);
   check(`${width}px intended Member Account panel retained`,await b.locator('#accountStatus').count()===1);
   await a.context().close();await b.context().close();
  }
  const host=await makePage({restricted:true});await ready(host);
  await host.waitForFunction(()=>document.querySelector('#roomStatus').textContent.includes('unavailable'));
  check('restricted guest authentication is reproduced',true);
  await reveal(host,'golferLogin');await host.locator('#golferEmail').fill('qa@example.test');await host.locator('#golferPassword').fill('local-fixture-only');await host.locator('#golferLogin').click();
  await host.waitForFunction(()=>document.querySelector('#accountStatus').textContent.includes('Welcome back'));
  check('existing member sign-in recovers without reload',true);
  await reveal(host,'roomCreate');await host.locator('#roomMe').fill('Austin');await host.locator('#roomPlayers').fill('Buddy');await host.locator('#roomFormat').selectOption('hole');await host.locator('#roomStake').fill('10');await host.locator('#roomCreate').click();
  await host.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);
  const compact=await host.locator('#roomCode').inputValue(),[id,invite]=compact.split(':');const link=origin+'/?room='+id+'&invite='+invite;
  check('host creates a room after failed guest startup',docs.get('rooms/'+id)?.hostUid==='host-member');
  const guest=await makePage();await ready(guest,link);
  check('fresh invitation lands in Ledger without profile setup',await guest.locator('#tab-bets').getAttribute('aria-current')==='page');
  await guest.locator('#roomQuickName').fill('Buddy');await guest.locator('#roomQuickJoin').click();
  await guest.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);
  check('buddy joins with name and one tap',await guest.locator('#roomSpectator').isVisible());
  check('joining performs no membership pre-read',!operations.some(x=>x.kind==='get'&&x.ref.includes('/members/')));
  check('buddy score editing is disabled',await guest.locator('#roomSaveHole').isDisabled());
  await host.locator('#roomScoreRows input').nth(0).fill('4');await host.locator('#roomScoreRows input').nth(1).fill('5');await host.locator('#roomSaveHole').click();
  await guest.waitForFunction(()=>document.querySelector('#roomStandings').textContent.includes('1 holes scored'));
  check('host score reaches the other browser',await guest.locator('#roomStandings').textContent().then(t=>t.includes('Austin: +$10.00')));
  const guestUid=await guest.evaluate(()=>JSON.parse(localStorage.qaIdentity).uid);
  await guest.reload({waitUntil:'networkidle'});await guest.locator('#roomQuickName').fill('Buddy');await guest.locator('#roomQuickJoin').click();await guest.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);
  check('reload/rejoin retains guest identity and saved score',guestUid===await guest.evaluate(()=>JSON.parse(localStorage.qaIdentity).uid)&&await guest.locator('#roomStandings').textContent().then(t=>t.includes('1 holes scored')));
  const bad=await makePage();await ready(bad,origin+'/?room='+id+'&invite='+'f'.repeat(16));await bad.locator('#roomQuickName').fill('Wrong invite');await bad.locator('#roomQuickJoin').click();await bad.waitForFunction(()=>document.querySelector('#roomStatus').textContent.includes('Unable to join'));
  check('incorrect invitation does not expose scorecard',await bad.locator('#roomScoreSection').isHidden());
  await host.evaluate(()=>window.__qaSetUser(null));
  check('signout immediately revokes cached host scorecard',await host.locator('#roomScoreSection').isHidden()&&await host.locator('#roomSaveHole').isDisabled());
  check('no uncaught page errors',errors.length===0);
 }finally{
  await browser.close();await new Promise(r=>server.close(r));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({backend:'LOCAL FAKE — not deployed Firebase rules, hosted auth, or physical phones',checks,errors},null,2));
  console.log(JSON.stringify({checks:checks.length,passed:checks.filter(x=>x.pass).length,errors},null,2));
 }
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
