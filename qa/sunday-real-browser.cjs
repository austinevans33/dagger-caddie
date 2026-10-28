// Real app + Firebase 11.10 SDK + deployed staging. No fake auth or database.
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=path.resolve(__dirname,'..'),source=path.join(root,'staging-app'),project='dagger-country-club-staging';
assert.ok(fs.readFileSync(path.join(source,'firebase-config.js'),'utf8').includes('projectId: "'+project+'"'));
const checks=[],errors=[],blocked=[],cleanup=[],pages=[];let browser,host,roomId;
const check=(name,pass)=>{checks.push({name,pass:!!pass});console.log(JSON.stringify(checks.at(-1)));assert.ok(pass,name);};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(source,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));
 if(!file.startsWith(source+path.sep)||!fs.existsSync(file)){res.statusCode=404;res.end('Missing');return;}
 const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote'];let proxy;
 // Pin only the known sandbox proxy CA keys in this isolated test process.
 // This is transport setup for the runner, never a shipped application change.
 const proxyUrl=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
 if(proxyUrl){const u=new URL(proxyUrl);proxy={server:u.origin,bypass:'127.0.0.1,localhost',username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)};
  const caDir='/usr/local/share/ca-certificates';const pins=fs.readdirSync(caDir).filter(n=>n.endsWith('.crt')).map(n=>{
   const cert=new crypto.X509Certificate(fs.readFileSync(path.join(caDir,n)));return crypto.createHash('sha256').update(cert.publicKey.export({type:'spki',format:'der'})).digest('base64');});
  args.push('--ignore-certificate-errors-spki-list='+pins.join(','));
 }
 async function makePage(){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());let allow=url.origin===origin;
   if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/11.10.0/'))allow=true;
   if(['identitytoolkit.googleapis.com','securetoken.googleapis.com'].includes(url.hostname)){
    const key=/apiKey:\s*"([^"]+)"/.exec(fs.readFileSync(path.join(source,'firebase-config.js'),'utf8'))[1];allow=url.searchParams.get('key')===key;
   }
   if(url.hostname==='firestore.googleapis.com'){
    const database=url.searchParams.get('database');
    allow=database?database===`projects/${project}/databases/(default)`:
     url.pathname.includes('/projects/'+project+'/')||url.pathname.startsWith('/google.firestore.v1.Firestore/');
   }
   if(allow)return route.continue();blocked.push({host:url.hostname,path:url.pathname});return route.abort();
  });
  const page=await context.newPage();pages.push(page);page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());return page;
 }
 async function ready(page,url=origin){await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#manualclub')?.children.length>0);}
 async function reveal(page,id){const tab=await page.locator('#'+id).evaluate(e=>e.closest('[data-tab]')?.dataset.tab);if(tab)await page.locator('#tab-'+tab).click();
  for(const d of await page.locator('#'+id).locator('xpath=ancestor::details').all())if(!await d.evaluate(e=>e.open))await d.locator(':scope > summary').click();}
 async function identity(page){return page.evaluate(async()=>{const {getAuth}=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');return getAuth().currentUser?.uid;});}
 try{
  browser=await chromium.launch({headless:true,proxy,executablePath:path.resolve(root,'../browser-tools/chromium-renderer'),args});
  host=await makePage();await ready(host);await host.waitForFunction(()=>document.querySelector('#roomStatus').textContent.includes('Live sync ready'));
  check('Actual app signs host in anonymously against staging',!!await identity(host));
  await reveal(host,'roomCreate');await host.locator('#roomMe').fill('QA Host');await host.locator('#roomPlayers').fill('QA Buddy');await host.locator('#roomFormat').selectOption('hole');await host.locator('#roomStake').fill('10');await host.locator('#roomCreate').click();
  await host.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);const compact=await host.locator('#roomCode').inputValue();const [id,invite]=compact.split(':');roomId=id;
  check('Host creates room using existing app controls',/^[0-9a-f]{32}$/.test(id));
  const guest=await makePage();await ready(guest,origin+'/?room='+id+'&invite='+invite);
  await guest.waitForFunction(()=>document.querySelector('#tab-bets').getAttribute('aria-current')==='page');
  check('Invitation opens Ledger on a fresh profile without bag setup',await guest.locator('#roomQuickName').isVisible());
  await guest.locator('#roomQuickName').fill('QA Buddy');await guest.locator('#roomQuickJoin').click();await guest.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);
  check('Name and one tap join the real staging room',await guest.locator('#roomSpectator').isVisible());
  check('Guest controls cannot edit scores',await guest.locator('#roomSaveHole').isDisabled());
  check('Host and guest use distinct Firebase identities',await identity(host)!==await identity(guest));
  await host.locator('#roomScoreRows input').nth(0).fill('4');await host.locator('#roomScoreRows input').nth(1).fill('5');await host.locator('#roomSaveHole').click();
  await guest.waitForFunction(()=>document.querySelector('#roomStandings').textContent.includes('1 holes scored'));
  check('Firebase live listener delivers host score to other browser',await guest.locator('#roomStandings').textContent().then(t=>t.includes('QA Host: +$10.00')));
  const uid=await identity(guest);await guest.reload({waitUntil:'domcontentloaded'});await guest.waitForFunction(()=>document.querySelector('#manualclub')?.children.length>0);
  await guest.locator('#roomQuickName').fill('QA Buddy');await guest.locator('#roomQuickJoin').click();await guest.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);
  check('Reload and rejoin preserve identity and official score',uid===await identity(guest)&&await guest.locator('#roomStandings').textContent().then(t=>t.includes('1 holes scored')));
  await host.locator('#roomFinish').click();await guest.waitForFunction(()=>document.querySelector('#roomWho').textContent.includes('MATCH ARCHIVED'));
  check('Host archive reaches guest through live listener',await host.locator('#roomSaveHole').isDisabled());
  check('No uncaught application errors',errors.length===0);
 }catch(error){errors.push(error.message);console.error(error.message);process.exitCode=1;}
 finally{
  if(host&&roomId){try{cleanup.push(await host.evaluate(async id=>{const {getFirestore,doc,getDoc,updateDoc}=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');const ref=doc(getFirestore(),'rooms',id),snap=await getDoc(ref);if(snap.exists()&&!snap.data().archived)await updateDoc(ref,{archived:true,lastChange:Date.now()});return {action:'Archive QA room',pass:true};},roomId));}catch(e){cleanup.push({action:'Archive QA room',pass:false,error:e.message});}}
  for(const page of pages){try{cleanup.push(await page.evaluate(async()=>{const {getAuth,deleteUser}=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');const user=getAuth().currentUser;if(user)await deleteUser(user);return {action:'Delete disposable staging identity',pass:true};}));}catch(e){cleanup.push({action:'Delete disposable staging identity',pass:false,error:e.message});}}
  if(browser)await browser.close();await new Promise(r=>server.close(r));
  fs.writeFileSync(path.join(__dirname,'results/staging-real-browser.json'),JSON.stringify({backend:'Real staging Firebase 11.10 SDK, two isolated Chromium profiles, local app origin; not physical phones or hosted release',checks,errors,blocked,cleanup,test_room_path:roomId?'rooms/'+roomId:null},null,2));
  console.log(JSON.stringify({checks:checks.length,passed:checks.filter(x=>x.pass).length,errors,blocked,cleanup},null,2));
 }
})();
