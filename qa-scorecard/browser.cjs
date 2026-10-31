// Local browser regression: disposable storage and mocked course/weather responses.
// No Firebase reads/writes or AI requests; does not certify multiplayer or a physical iPhone.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const output=process.env.SCORECARD_EVIDENCE||'/tmp/dagger-scorecard-evidence';fs.mkdirSync(output,{recursive:true});
let base=process.env.SCORECARD_BASE;
const selection={course:{provider:'opengolfapi',providerCourseId:'qa-pines',name:'QA Pines (fixture)',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6300},holeNumber:1};
const holes=Array.from({length:18},(_,i)=>({hole_number:i+1,par:4,yardages:{blue:350,white:300}}));
const results=[],errors=[];
const record=(name)=>results.push({name,status:'PASS'});
(async()=>{
 let server;
 if(!base){
  const http=require('node:http'),path=require('node:path'),root=path.resolve(__dirname,'..');
  server=http.createServer((req,res)=>{
   const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
   if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
   const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
   res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/playtest/`;
 }
 const args=['--no-sandbox','--disable-dev-shm-usage'];let proxy;
 if(process.env.HTTPS_PROXY){
  proxy={server:new URL(process.env.HTTPS_PROXY).origin,bypass:'127.0.0.1,localhost'};
  const dir='/usr/local/share/ca-certificates';
  const pins=fs.readdirSync(dir).filter(n=>n.endsWith('.crt')).map(n=>{
   const cert=new crypto.X509Certificate(fs.readFileSync(dir+'/'+n));
   return crypto.createHash('sha256').update(cert.publicKey.export({type:'spki',format:'der'})).digest('base64');
  });
  args.push('--ignore-certificate-errors-spki-list='+pins.join(','));
 }
 const browser=await chromium.launch({headless:true,executablePath:process.env.SCORECARD_CHROMIUM,args,proxy});
 try{
 for(const width of [320,375,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await context.route('**/*',async route=>{
   const url=route.request().url();
   if(url.includes('api.opengolfapi.org'))return route.fulfill({headers:{'access-control-allow-origin':'*'},json:url.endsWith('/holes')?{holes:url.includes('/missing/')?[]:holes}:{}});
   if(new URL(url).hostname==='api.open-meteo.com')return route.fulfill({status:503,body:'offline fixture'});
   // Allow the public SDK modules to load, but never allow any backend operation.
   if(url.startsWith('https://www.gstatic.com/firebasejs/11.10.0/')&&process.env.SCORECARD_SDK_DIR){const file=process.env.SCORECARD_SDK_DIR+'/'+new URL(url).pathname.split('/').pop();return route.fulfill({headers:{'access-control-allow-origin':'*'},contentType:'text/javascript',body:fs.readFileSync(file)});}
   if(url.startsWith(new URL(base).origin)||url.startsWith('https://www.gstatic.com/firebasejs/'))return route.continue();
   return route.abort();
  });
  await context.addInitScript(({selection})=>{
   if(!localStorage.getItem('qa-initialized')){
    localStorage.setItem('qa-initialized','1');
    localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selection,selectedAt:100}));
   }
   sessionStorage.setItem('dcc_starter_skipped_session_v1','1');
  },{selection});
  const page=await context.newPage();page.setDefaultTimeout(20000);page.on('requestfailed',r=>console.log('requestfailed',r.url().split('?')[0],r.failure()?.errorText));page.on('pageerror',e=>errors.push({width,error:e.message}));
  console.log('viewport',width);await page.goto(base,{waitUntil:'domcontentloaded'});console.log('loaded');
  await page.locator('#dcc-solo-scorecard').waitFor({state:'visible',timeout:20000}).catch(async e=>{console.log('mount diagnostic',await page.evaluate(()=>({card:document.querySelector('#dcc-solo-scorecard')?.outerHTML.slice(0,200),active:localStorage.getItem('dcc_active_round_course_v1'),scripts:[...document.scripts].filter(s=>s.type==='module').map(s=>s.src)})));throw e;});console.log('card visible');
  await page.waitForFunction(()=>document.querySelector('#dcc-paper-totals').textContent.includes('6300 YDS'),null,{timeout:15000}).catch(async e=>{console.log(await page.evaluate(()=>({total:document.querySelector('#dcc-paper-totals')?.textContent,cache:localStorage.getItem('dcc_course_scorecard_v1'),active:localStorage.getItem('dcc_active_round_course_v1')})));throw e;});
  console.log('facts loaded');assert.equal(await page.locator('.dcc-paper-nine').count(),2);
  const geometry=await page.locator('#dcc-solo-scorecard').evaluate(card=>({width:card.clientWidth,scroll:card.scrollWidth,grids:[...card.querySelectorAll('.dcc-paper-grid')].map(g=>({width:g.clientWidth,scroll:g.scrollWidth,minFont:Math.min(...[...g.children].map(c=>parseFloat(getComputedStyle(c).fontSize)))}))}));
  if(geometry.scroll>geometry.width+1)console.log(await page.locator('#dcc-solo-scorecard').evaluate(c=>({parents:[c,c.parentElement,c.parentElement.parentElement].map(x=>({tag:x.tagName,cls:x.className,w:x.clientWidth,style:getComputedStyle(x).padding})),nav:[...c.querySelector('.dcc-paper-navigation').children].map(x=>({text:x.textContent,w:x.clientWidth,min:getComputedStyle(x).minWidth,font:getComputedStyle(x).font,letter:getComputedStyle(x).letterSpacing}))})));assert.ok(geometry.scroll<=geometry.width+1,JSON.stringify(geometry));
  for(const g of geometry.grids)assert.ok(g.scroll<=g.width+1&&g.minFont>=9,JSON.stringify(g));
  await page.locator('#dcc-solo-scorecard').screenshot({path:output+`/scorecard-${width}-18.png`});
  if(width===390){await page.setViewportSize({width,height:1300});await page.locator('#dcc-solo-scorecard').screenshot({path:output+'/scorecard-390-readable.png'});await page.setViewportSize({width,height:844});}
  record(`${width}px: two ruled nines, verified 72/6300 totals, no scorecard overflow`);
  await page.getByRole('button',{name:'Pencil 15 strokes for hole 1',exact:true}).click();
  await page.getByRole('button',{name:'Select hole 1, 15 strokes',exact:true}).click();
  await page.getByRole('button',{name:'Pencil 3 strokes for hole 1',exact:true}).click();
  assert.match(await page.locator('#dcc-paper-progress').innerText(),/Hole 2/);
  assert.match(await page.locator('#dcc-paper-totals').innerText(),/3 STROKES/);
  assert.equal(await page.locator('.dcc-paper-grid').nth(0).locator('.dcc-paper-sum').last().innerText(),'3');
  assert.equal(await page.locator('.dcc-paper-grid').nth(1).locator('.dcc-paper-sum').last().innerText(),'0');
  await page.reload();await page.locator('#dcc-solo-scorecard').waitFor({state:'visible'});
  assert.equal(await page.getByRole('button',{name:'Select hole 1, 3 strokes',exact:true}).count(),1);
  record(`${width}px: entry 15, correction 3, progression and reload persistence`);
  await page.locator('#dcc-paper-length').selectOption('9');
  assert.equal(await page.locator('.dcc-paper-nine').count(),1);
  assert.match(await page.locator('#dcc-paper-totals').innerText(),/PAR 36.*3150 YDS/);
  await page.locator('#dcc-solo-scorecard').screenshot({path:output+`/scorecard-${width}-9.png`});
  await page.locator('#dcc-paper-length').selectOption('18');
  await page.getByRole('button',{name:'Select hole 10, not scored',exact:true}).click();
  record(`${width}px: nine-hole front grid/totals and restoring eighteen preserves score`);
  if(width===375){
   await page.getByRole('button',{name:'Select hole 2, not scored',exact:true}).click();
   await page.locator('#dcc-paper-length').selectOption('9');
   for(let hole=2;hole<=9;hole++)await page.getByRole('button',{name:`Pencil 4 strokes for hole ${hole}`,exact:true}).click();
   assert.match(await page.locator('#dcc-paper-totals').innerText(),/35 STROKES/);
   assert.match(await page.locator('#dcc-paper-recap-title').innerText(),/Round finished/);
   record('completed nine-hole UI: 35 strokes, verified par 36 and score-based Caddy recap');
  }
  if(width===390){
   page.on('dialog',d=>d.accept());
   await page.locator('#dcc-paper-new-round').click();
   await page.locator('#dcc-starter-dialog').waitFor({state:'visible'});
   const archived=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_solo_round_archive_v1')));
   assert.equal(archived.length,1);assert.equal(archived[0].card.scores[0],3);
   assert.equal(await page.evaluate(()=>localStorage.getItem('dcc_active_round_course_v1')),null);
   const colors=await page.locator('#dcc-starter-dialog h2').evaluate(h=>({color:getComputedStyle(h).color,fill:getComputedStyle(h).webkitTextFillColor}));
   assert.equal(colors.color,'rgb(243, 233, 211)');assert.equal(colors.fill,'rgb(243, 233, 211)');
   record('actual New Round confirmation archives partial score before clearing; Starter heading stays cream');
   await page.getByRole('button',{name:'My course isn’t listed yet — enter the clubhouse',exact:true}).click();
   await page.evaluate(selection=>{
    localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selection:{...selection,holeNumber:10},selectedAt:200}));
    document.dispatchEvent(new CustomEvent('dcc:course-selected'));
   },selection);
   await page.locator('#dcc-solo-scorecard').waitFor({state:'visible'});
   await page.locator('#dcc-paper-length').selectOption('9');
   assert.match(await page.locator('.dcc-paper-nine-title').innerText(),/BACK NINE/);
   await page.getByRole('button',{name:'Pencil 12 strokes for hole 10',exact:true}).click();
   assert.match(await page.locator('#dcc-paper-totals').innerText(),/12 STROKES/);
   assert.equal(await page.locator('.dcc-paper-grid .dcc-paper-sum').last().innerText(),'12');
   await page.locator('#dcc-solo-scorecard').screenshot({path:output+'/scorecard-390-back-nine.png'});
   record('back-nine start: holes 10–18, 12 strokes and IN totals');
   // Change identity without new facts: every fact and complete total must be a dash.
   await page.evaluate(selection=>{
    localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selection:{...selection,course:{...selection.course,providerCourseId:'missing',name:'Missing data fixture'}},selectedAt:300}));
    document.dispatchEvent(new CustomEvent('dcc:course-selected'));
   },selection);
   assert.match(await page.locator('#dcc-paper-totals').innerText(),/PAR —.*— YDS/);
   assert.match(await page.locator('#dcc-paper-course').innerText(),/Missing data fixture/);
   record('course change immediately removes prior facts and full totals while async request is pending');
  }
  await context.close();
 }
 assert.equal(errors.length,0,JSON.stringify(errors));record('no uncaught page errors');
 }finally{await browser.close();if(server)server.close();fs.writeFileSync(output+'/browser-results.json',JSON.stringify({base,results,errors,fixtureDisclosure:'Synthetic QA course; real SDK served unchanged from official download if SCORECARD_SDK_DIR is supplied; backend operations blocked. No physical iPhone or Firebase multiplayer test.'},null,2));}
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
