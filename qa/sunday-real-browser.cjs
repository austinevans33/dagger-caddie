// Real app + Firebase 11.10 SDK + deployed staging. No fake auth or database.
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),assert=require('assert/strict');
const jsQR=require('jsqr');
// Resolve Playwright from an explicitly configured runtime or a conventional local install.
const playwrightModule=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
 ? require(require('path').join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'))
 : require('playwright');
const {chromium}=playwrightModule;
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
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=process.env.DCC_STAGING_ORIGIN||('http://127.0.0.1:'+server.address().port);
 if(process.env.DCC_STAGING_ORIGIN){const target=new URL(origin);assert.equal(target.protocol,'https:');assert.match(target.hostname,/^dagger-country-club-staging--(?:sunday-test|qr-candidate|recovery-candidate|bbb-candidate)-[a-z0-9-]+\.web\.app$/);}

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
 async function reveal(page,id){
  const target=page.locator('#'+id);
  const tab=await target.evaluate(e=>e.closest('[data-tab]')?.dataset.tab);
  if(tab)await page.locator('#tab-'+tab).click();
  // XPath ancestor::details returns nearest-first; visible clicks require outer-first.
  // Never change the DOM 'open' attribute directly: this must test real user controls.
  const ancestors=await target.locator('xpath=ancestor::details').all();
  for(const detail of ancestors.reverse()){
   if(!await detail.evaluate(e=>e.open))await detail.locator(':scope > summary').click();
  }
  await target.waitFor({state:'visible'});
 }
 async function identity(page){return page.evaluate(async()=>{const {getAuth}=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');return getAuth().currentUser?.uid;});}
 try{
  const configuredBrowser=process.env.DCC_CHROMIUM_EXECUTABLE;
  const legacyBrowser=path.resolve(root,'../browser-tools/chromium-renderer');
  const executablePath=configuredBrowser || (fs.existsSync(legacyBrowser)?legacyBrowser:undefined);
  if(executablePath)assert.ok(fs.existsSync(executablePath),'Configured Chromium executable not found');
  browser=await chromium.launch({headless:true,proxy,...(executablePath?{executablePath}:{}),args});
  host=await makePage();await ready(host);await host.waitForFunction(()=>document.querySelector('#roomStatus').textContent.includes('Live sync ready'));
  check('Actual app signs host in anonymously against staging',!!await identity(host));
  if(process.env.DCC_EXPECT_BBB==='1'){
   await host.waitForSelector('#gStake',{state:'attached'});
   await host.locator('#tab-games').click();
   await host.locator('#dccGameChoices .game-pick[data-game="bingo"]').click();
   check('Visible Games selector exposes BBB scorecard',await host.locator('#dccSelectedGamePanel').evaluate(e=>e.open)&&await host.locator('#gStart').isVisible());
   await reveal(host,'gStart');await host.locator('#gP1').fill('QA Host');await host.locator('#gP2').fill('QA Buddy');await host.locator('#gStake').fill('1.25');await host.locator('#gStart').click();
   await reveal(host,'gSave');for(const id of ['gBingo','gBango','gBongo'])await host.locator('#'+id).selectOption('0');await host.locator('#gSave').click();
   check('Hosted BBB awards show plus and minus $3.75',await host.locator('#bbbLiveStandings').textContent().then(t=>t.includes('+$3.75')&&t.includes('−$3.75')));
   await ready(host);await host.waitForFunction(()=>document.querySelector('#bbbLiveStandings').textContent.includes('+$3.75'));
   check('Hosted BBB stake and awards survive reload',await host.evaluate(()=>JSON.parse(localStorage.dagger_bbb_active).stake===1.25));
   await reveal(host,'gFinish');await host.locator('#gFinish').click();
   check('Hosted BBB archive enters Ledger',await host.locator('#wHistory').textContent().then(t=>t.includes('bingo')&&t.includes('+$3.75')));
   await ready(host);await host.waitForFunction(()=>document.querySelector('#wHistory').textContent.includes('+$3.75'));
   check('Hosted BBB reload does not duplicate settlement',await host.evaluate(()=>JSON.parse(localStorage.dagger_foursome_history).filter(g=>g.format==='bingo').length===1));
   await reveal(host,'wHistory');await host.locator('#wHistory tr').filter({hasText:'bingo'}).click();
   check('Hosted BBB inspector preserves point counts including zeros',await host.locator('#dccArchiveHoles tr').first().textContent().then(t=>t==='130'));
   await host.screenshot({path:path.join(root,'qa/results/bbb-hosted-ledger.png'),fullPage:true});
  }
  await reveal(host,'roomCreate');await host.locator('#roomMe').fill('QA Host');await host.locator('#roomPlayers').fill('QA Buddy');await host.locator('#roomFormat').selectOption('hole');await host.locator('#roomStake').fill('10');await host.locator('#roomCreate').click();
  await host.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);const compact=await host.locator('#roomCode').inputValue();const [id,invite]=compact.split(':');roomId=id;
  check('Host creates room using existing app controls',/^[0-9a-f]{32}$/.test(id));
  let joinUrl=origin+'/?room='+id+'&invite='+invite;
  if(process.env.DCC_EXPECT_QR==='1'){
   await host.evaluate(()=>{
    Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
    Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{window.__qaShare=payload;}});
   });
   await host.locator('#roomShareCurrent').click();await host.waitForFunction(()=>window.__qaShare?.files?.length===1);
   const raster=await host.evaluate(async()=>{
    const file=window.__qaShare.files[0],bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');
    canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);
    return {pixels:Array.from(ctx.getImageData(0,0,canvas.width,canvas.height).data),width:canvas.width,height:canvas.height,type:file.type};
   });
   const scanned=jsQR(Uint8ClampedArray.from(raster.pixels),raster.width,raster.height)?.data;
   check('Actual Share control creates PNG QR for this hosted invitation',raster.type==='image/png'&&scanned===joinUrl);
   joinUrl=scanned;
  }
  const guest=await makePage();await ready(guest,joinUrl);
  await guest.waitForFunction(()=>document.querySelector('#tab-bets').getAttribute('aria-current')==='page');
  check('Invitation opens Ledger on a fresh profile without bag setup',await guest.locator('#roomQuickName').isVisible());
  await guest.locator('#roomQuickName').fill('QA Buddy');await guest.locator('#roomQuickJoin').click();await guest.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);
  check('Name and one tap join the real staging room',await guest.locator('#roomSpectator').isVisible());
  check('Guest controls cannot edit scores',await guest.locator('#roomSaveHole').isDisabled());
  check('Host and guest use distinct Firebase identities',await identity(host)!==await identity(guest));
  await host.locator('#roomScoreRows input').nth(0).fill('4');await host.locator('#roomScoreRows input').nth(1).fill('5');await host.locator('#roomSaveHole').click();
  await guest.waitForFunction(()=>document.querySelector('#roomStandings').textContent.includes('1 holes scored'));
  check('Firebase live listener delivers host score to other browser',await guest.locator('#roomStandings').textContent().then(t=>t.includes('QA Host: +$10.00')));
  let expectedHoles=1;
  if(process.env.DCC_EXPECT_RECOVERY==='1'){
   const hostUid=await identity(host);await host.reload({waitUntil:'domcontentloaded'});await host.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);
   check('Host reload restores same identity and official room without invitation',hostUid===await identity(host)&&await host.locator('#roomCode').inputValue()===compact&&await host.locator('#roomSaveHole').isEnabled()&&await host.locator('#roomStandings').textContent().then(t=>t.includes('1 holes scored')));
   await host.locator('#roomScoreRows input').nth(0).fill('5');await host.locator('#roomScoreRows input').nth(1).fill('4');await host.locator('#roomSaveHole').click();
   await guest.waitForFunction(()=>document.querySelector('#roomStandings').textContent.includes('2 holes scored'));expectedHoles=2;
   check('Recovered host can record next official hole and deliver it live',true);
  }
  const uid=await identity(guest);await guest.reload({waitUntil:'domcontentloaded'});await guest.waitForFunction(()=>document.querySelector('#manualclub')?.children.length>0);
  if(process.env.DCC_EXPECT_RECOVERY!=='1'){await guest.locator('#roomQuickName').fill('QA Buddy');await guest.locator('#roomQuickJoin').click();}
  await guest.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);
  check('Reload and rejoin preserve identity and official score',uid===await identity(guest)&&await guest.locator('#roomStandings').textContent().then(t=>t.includes(expectedHoles+' holes scored')));
  if(process.env.DCC_EXPECT_RECOVERY==='1'){
   await ready(guest,origin);await guest.waitForFunction(()=>!document.querySelector('#roomScoreSection').hidden);
   check('Guest reopening app home resumes same room as read-only',uid===await identity(guest)&&await guest.locator('#roomSaveHole').isDisabled()&&await guest.locator('#roomCode').inputValue()===compact);
  }
  await host.locator('#roomFinish').click();await guest.waitForFunction(()=>document.querySelector('#roomWho').textContent.includes('MATCH ARCHIVED'));
  check('Host archive reaches guest through live listener',await host.locator('#roomSaveHole').isDisabled());
  if(process.env.DCC_EXPECT_RECOVERY==='1'){
   check('Confirmed archive clears recovery bookmarks on both phones',await host.evaluate(()=>!localStorage.dagger_active_money_room)&&await guest.evaluate(()=>!localStorage.dagger_active_money_room));
   await ready(host,origin);await host.waitForFunction(()=>document.querySelector('#roomStatus').textContent.includes('Live sync ready'));
   check('Archived match does not reopen automatically on next launch',await host.locator('#roomScoreSection').isHidden());
  }
  check('No uncaught application errors',errors.length===0);
 }catch(error){errors.push(error.stack||error.message);console.error(error.stack||error.message);process.exitCode=1;
  // Preserve the actual screen at failure for hosted user-path diagnosis; do not force visibility.
  if(host&&!host.isClosed())try{fs.mkdirSync(path.join(__dirname,'results'),{recursive:true});await host.screenshot({path:path.join(__dirname,'results/bbb-hosted-failure.png'),fullPage:true,timeout:10000});}catch(_){}
 }
 finally{
  if(host&&roomId){try{cleanup.push(await host.evaluate(async id=>{const {getFirestore,doc,getDoc,updateDoc}=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');const ref=doc(getFirestore(),'rooms',id),snap=await getDoc(ref);if(snap.exists()&&!snap.data().archived)await updateDoc(ref,{archived:true,lastChange:Date.now()});return {action:'Archive QA room',pass:true};},roomId));}catch(e){cleanup.push({action:'Archive QA room',pass:false,error:e.message});}}
  for(const page of pages){try{cleanup.push(await page.evaluate(async()=>{const {getAuth,deleteUser}=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');const user=getAuth().currentUser;if(user)await deleteUser(user);return {action:'Delete disposable staging identity',pass:true};}));}catch(e){cleanup.push({action:'Delete disposable staging identity',pass:false,error:e.message});}}
  if(browser)await browser.close();await new Promise(r=>server.close(r));
  fs.mkdirSync(path.join(__dirname,'results'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'results/staging-real-browser.json'),JSON.stringify({backend:'Real staging Firebase 11.10 SDK, two isolated Chromium profiles; not physical phones',app_origin:origin,checks,errors,blocked,cleanup,test_room_path:roomId?'rooms/'+roomId:null},null,2));
  console.log(JSON.stringify({checks:checks.length,passed:checks.filter(x=>x.pass).length,errors,blocked,cleanup},null,2));
 }
})();
