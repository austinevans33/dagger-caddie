import {test,expect} from '@playwright/test';
test('Games bet survives opening the Yardage Book and returning',async({page})=>{
 await page.goto('/playtest/');
 await page.evaluate(()=>{localStorage.setItem('dagger_foursome_active',JSON.stringify({players:['A','B'],format:'skins',stake:5,holes:[[4,5]],started:123}));localStorage.setItem('dagger_bbb_active',JSON.stringify({players:['A','B'],holes:[[0,1,null]],started:123}));});
 await page.reload();
 const before=await page.evaluate(()=>({w:localStorage.getItem('dagger_foursome_active'),b:localStorage.getItem('dagger_bbb_active')}));
 await test.step('dismiss opening Starter Desk and complete starter setup',async()=>{const desk=page.locator('#dcc-starter-dialog');if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());}await page.locator('#useAustin').click({timeout:5000})});
 await test.step('open Clubhouse',async()=>{await page.locator('#tab-play').click({timeout:5000})});
 await test.step('show Yardage Book link',async()=>{await expect(page.locator('#dccHomeYardage')).toBeVisible({timeout:5000})});
 await test.step('open Yardage Book',async()=>{await page.locator('#dccHomeYardage').click({timeout:5000})});
 await expect(page.locator('#position')).toContainText('HOLE 1 / 18');
 await page.locator('#next').click();
 await expect(page.locator('#position')).toContainText('HOLE 2 / 18');
 await page.locator('#return').click();
 await expect(page).toHaveURL(/\/playtest\/?$/);
 await expect(page.locator('#tab-play')).toHaveClass(/active/);
 const after=await page.evaluate(()=>({w:localStorage.getItem('dagger_foursome_active'),b:localStorage.getItem('dagger_bbb_active')}));
 expect(after).toEqual(before);
});
test('Clubhouse has one Yardage Book entry and one House Ghost launch',async({page})=>{
 await page.goto('/playtest/');
 await expect(page.locator('#dccHomeYardage')).toHaveAttribute('href',/yardage-preview\.html/);
 await expect(page.locator('#dccGroundsDoors')).toHaveCount(0);
 await expect(page.locator('#dccClubhouseHome [data-dcc-go="ghost"]')).toHaveCount(1);
 await expect(page.locator('a[href="19th-hole.html"]').first()).toHaveCount(1);
});

test('Caddy roster and AI interface remain in playable app',async({page})=>{
 await page.goto('/playtest/');
 await expect(page.locator('.caddie-roster').first()).toHaveCount(1);
 await expect(page.locator('script[src*="ai-chat.js"]')).toHaveCount(1);
 const aiResponse=await page.request.get('/playtest/ai-chat.js');
 expect(aiResponse.ok()).toBeTruthy();
 expect(await aiResponse.text()).toContain('createCaddyCourseBriefing');
});

test('Capture Friday iPhone-sized Play, Games and Ledger views for release review',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#useAustin').click({timeout:5000});
 await page.locator('#tab-play').click();
 await expect(page.locator('#dccClubhouseHome')).toBeVisible();
 await page.screenshot({path:'candidate-screenshots/01-play-iphone.png',animations:'disabled'});
 await page.locator('#tab-games').click();
 await expect(page.locator('#gamesMenu')).toBeAttached();
 await expect(page.locator('#dccGroundsDoors')).toHaveCount(0);
 await page.screenshot({path:'candidate-screenshots/02-games-iphone.png',animations:'disabled'});
 await page.locator('#tab-bets').click();
 await expect(page.locator('[data-tab="bets"]').first()).toBeVisible();
 await expect(page.locator('#dccLedgerRecordsLinks')).toBeVisible();
 await expect(page.locator('#dccSimpleLedger .dcc-simple-room > summary')).toBeVisible();
 await expect(page.locator('#dccSimpleLedger .dcc-simple-room > summary')).toHaveCSS('color','rgb(241, 231, 208)');
 await page.screenshot({path:'candidate-screenshots/03-ledger-iphone.png',animations:'disabled'});
 await page.locator('#dccLedgerRecordsLinks').evaluate(el=>el.scrollIntoView({block:'center'}));
 await page.screenshot({path:'candidate-screenshots/07-ledger-records-iphone.png',animations:'disabled'});
});

test('Clubhouse is the first Play destination with genuine app navigation',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#useAustin').click({timeout:5000});
 const home=page.locator('#dccClubhouseHome');
 await expect(home).toBeVisible();
 await expect(home.locator('img.dcc-home-seal')).toHaveAttribute('src','dcc-approved-seal.png');
 await expect(home.locator('#dccHomeYardage')).toHaveAttribute('href',/yardage-preview\.html/);
 await expect(home.locator('[data-dcc-go="ghost"]')).toHaveCount(1);
 await home.locator('[data-dcc-go="games"]').click();
 await expect(page.locator('#gamesMenu')).toBeVisible();
 await page.locator('#tab-play').click();
 await home.locator('[data-dcc-go="ledger"]').click();
 await expect(page.locator('#moneyRoomSection')).toBeAttached();
 await page.locator('#tab-play').click();
 await expect(home).toBeVisible();
 await page.screenshot({path:'candidate-screenshots/04-clubhouse-new-iphone.png',animations:'disabled'});
});
test('The Ledger shows a two-column overview, one ticket window and one competition archive route',async({page})=>{
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#useAustin').click({timeout:5000});
 await page.locator('#tab-bets').click();
 await expect(page.locator('#dccSimpleLedger')).toBeVisible();
 await expect(page.locator('#dccSimpleListHost #dccPropList')).toHaveCount(1);
 await expect(page.locator('#dccPropHistoryWrap')).toBeHidden();
 await expect(page.locator('#dccPropHistoryWrap')).not.toHaveAttribute('open','');
 await expect(page.locator('#dccPropNew')).toBeVisible();
 await expect(page.locator('#dccPropBets .dcc-r66-stats > div')).toHaveCount(2);
 await expect(page.locator('#moneyRoomSection #roomMatchHistory')).toHaveCount(0);
 await expect(page.locator('#dccR77RecordsDrawer + #dccLedgerRecordsLinks #dcc19thHole')).toBeVisible();
 await expect(page.locator('#dcc19thHole')).toContainText('19th Hole Recap');
 await page.locator('#dccLedgerArchive').click();
 await expect(page.locator('#dccSavedGamesPanel')).toHaveAttribute('open','');
 await expect(page.locator('#dccSavedGamesPanel #roomMatchHistory')).toBeVisible();
 await expect(page.locator('#dccSavedGamesPanel #dccGhostArchivePanel')).toBeVisible();
 await expect(page.locator('#dccSavedGamesPanel #bbbArchivePanel')).toBeVisible();
});

test('House Ghost reuses mapped pencil sketch without treating simulated strokes as GPS',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'ghost-sketch-test',name:'Ghost Sketch Links',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6000},holeNumber:1}}));
  localStorage.setItem('dagger_foursome_active','{"protected":"untouched"}');
 });
 await page.route('https://api.opengolfapi.org/v1/courses/ghost-sketch-test/holes',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({holes:[{number:1,par:4,yardages:{white:405}},{number:2,par:3,yardages:{white:165}}]})}));
 const polygon=(type,hole,x)=>({type:'Feature',properties:{type,hole},geometry:{type:'Polygon',coordinates:[[[x,35],[x+.00005,35],[x+.00005,35.00005],[x,35]]]}});
 await page.route(url=>url.toString().startsWith('https://api.opengolfapi.org/api/v1/features?'),route=>{
  const n=Number(new URL(route.request().url()).searchParams.get('hole'));
  route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:n===1?[
   polygon('tee',1,-79),polygon('green',1,-79.002),polygon('bunker',1,-79.001)
  ]:[]})});
 });
 await page.goto('/playtest/ghost-preview.html');
 await expect(page.locator('#ghostHoleSketch polygon')).toHaveCount(3);
 await expect(page.locator('#ghostHoleSketch .route-mark')).toHaveCount(1);
 await expect(page.locator('#ghostMapStatus')).toContainText('Same mapped pencil drawing');
 await expect(page.locator('#traces path')).toHaveCount(0);
 await page.locator('#next').click();
 await expect(page.locator('#traces path')).toHaveCount(2);
 await page.locator('#hole').selectOption('2');
 await expect(page.locator('#ghostMapStatus')).toContainText('No mapped hole outlines');
 await expect(page.locator('#ghostHoleSketch polygon')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'))).toBe('{"protected":"untouched"}');
});

test('The Grounds opens the actual House Ghost rival picker',async({page})=>{
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#useAustin').click({timeout:5000});
 await page.locator('#tab-games').click();
 await page.locator('#dccR91SoloPanel > summary').click();
 await page.locator('#dccGhostTier').selectOption('scratch');
 await expect(page.locator('#dccGhostIdentityName')).toHaveText('THE UNDERTAKER');
 await expect(page.locator('#dccGhostPlay')).toHaveText('Start round');
});

test('House Ghost tracer draws animated schematic and watch mode',async({page})=>{
 await page.goto('/playtest/ghost-preview.html');
 await expect(page.locator('#traces path')).toHaveCount(0);
 await page.locator('#next').click();
 await expect(page.locator('#traces path')).toHaveCount(2);
 await expect(page.locator('#shots li')).toHaveCount(1);
 await page.locator('#watch').click();
 await expect(page.locator('#traces path')).toHaveCount(4);
 await page.locator('#watch').click();
 await expect(page.locator('#watch')).toContainText('Watch Ghost');
});

test('Clubhouse displays clean tab labels and opens existing Money Room setup',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#useAustin').click({timeout:5000});
 await expect(page.locator('#tab-play .dcc-tab-title')).toHaveText('The Clubhouse');
 await expect(page.locator('#tab-games .dcc-tab-title')).toHaveText('The Grounds');
 await expect(page.locator('#tab-bets .dcc-tab-title')).toHaveText('The Ledger');
 await expect(page.locator('#tab-settings .dcc-tab-title')).toHaveText('The Clubhouse');
 const home=page.locator('#dccClubhouseHome');
 await expect(home.locator('[data-dcc-go="money"]')).toBeVisible();
 await home.locator('[data-dcc-go="money"]').click();
 await expect(page.locator('#moneyRoomSection')).toBeAttached();
 await expect(page.locator('#roomSetup')).toHaveAttribute('open','');
 await page.locator('#tab-play').click();
 await home.locator('[data-dcc-go="ledger"]').click();
 await expect(page.locator('#tab-bets')).toHaveAttribute('aria-current','page');
 await page.locator('#tab-play').click();
 await expect(home.locator('img.dcc-home-seal')).toHaveAttribute('src','dcc-approved-seal.png');
});

test('Clubhouse has the entry doors and Grounds has no duplicate shortcuts',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#useAustin').click({timeout:5000});
 const home=page.locator('#dccClubhouseHome');
 await expect(home).toBeVisible();
 await expect(home.locator('[data-dcc-go="money"]')).toBeVisible();
 await expect(home.locator('.dcc-home-services')).toHaveCount(0);
 await expect(home.locator('.dcc-home-caddy')).toHaveCount(0);
 await expect(page.locator('section.caddie-roster[data-tab="play"]')).toBeHidden();
 await page.locator('#tab-games').click();
 await expect(page.locator('#dccGroundsDoors')).toHaveCount(0);
 await page.locator('#tab-bets').click();
 await expect(page.locator('#dccPropBets')).toBeVisible();
 await page.locator('#tab-play').click();
 await expect(home.locator('#dccHomeScorecard')).toBeVisible();
 await expect(home.locator('#dccHomeYardage')).toBeVisible();
});
test('Yardage Book uses actual selected tee/provider scorecard and preserves bets',async({page})=>{
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('dccCourseFixtureSeeded'))return;
  sessionStorage.setItem('dccCourseFixtureSeeded','1');
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:Date.now(),selection:{course:{provider:'opengolfapi',providerCourseId:'fixture-yardage',name:'Verified Test Course',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6300},holeNumber:1}}));
  localStorage.setItem('dagger_foursome_active',JSON.stringify({players:['A','B'],format:'skins',stake:5,holes:[[4,5]],started:123}));
 });
 await page.route('https://api.opengolfapi.org/v1/courses/fixture-yardage/holes',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({holes:[{number:1,par:4,yardages:{white:412,blue:443}},{number:2,par:3,yardages:{white:165,blue:184}}]})}));
 await page.goto('/playtest/');
 const initial=await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'));
 expect(JSON.parse(initial).players).toEqual(['A','B']);
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('#name')).toContainText('Verified Test Course · White');
 await expect(page.locator('#yards')).toContainText('412');
 await expect(page.locator('#par')).toContainText('4');
 await expect(page.locator('#coverage')).toContainText('2/18');
 await page.locator('#next').click();
 await expect(page.locator('#yards')).toContainText('165');
 await page.locator('#next').click();
 await expect(page.locator('#yards')).toContainText('Not verified');
 await page.locator('#return').click();
 await expect(page).toHaveURL('http://127.0.0.1:8765/playtest/');
 const after=await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'));
 expect(after).toBe(initial);
});

test('Real Bayonet White Yardage Book covers all 18 holes and safe caddy handoff',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'1c31d1fb-faa1-4d9f-80a2-f281982df126',name:'Bayonet at Puppy Creek',region:'NC'},tee:{providerTeeId:'white',name:'Regular / White',totalYards:5752},holeNumber:1}}));
  localStorage.setItem('dagger_selected_caddie',JSON.stringify('vinny'));
  localStorage.setItem('dagger_foursome_active',JSON.stringify({players:['Golfer','Friend'],format:'skins',stake:5,holes:[[4,5]],started:123}));
 });
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('#coverage')).toContainText('18/18');
 await expect(page.locator('#name')).toContainText('Bayonet at Puppy Creek · Regular / White');
 await expect(page.locator('#pocketCaddyName')).toContainText('Vinny');
 const par=[5,4,3,4,5,4,4,4,3,4,4,4,4,3,5,3,4,5];
 const yards=[433,370,134,366,440,326,345,378,142,292,308,317,346,140,415,148,402,450];
 for(let hole=1;hole<=18;hole++){
  await page.locator('#hole').selectOption(String(hole));
  await expect(page.locator('#position')).toContainText('HOLE '+hole+' / 18');
  await expect(page.locator('#par')).toContainText('Par: '+par[hole-1]);
  await expect(page.locator('#yards')).toContainText('Tee yards: '+yards[hole-1]);
 }
 await page.locator('#hole').selectOption('1');
 await page.screenshot({path:'candidate-screenshots/05-bayonet-yardage-iphone.png',animations:'disabled'});
 await page.locator('#askHoleCaddy').click();
 await page.waitForURL('**/playtest/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#aiInput')).toBeVisible();
 await expect(page.locator('#aiInput')).toHaveValue(/Bayonet at Puppy Creek/);
 await expect(page.locator('#aiInput')).toHaveValue(/hole 1/);
 await expect(page.locator('#aiInput')).toHaveValue(/433 yards/);
 const stored=await page.evaluate(()=>({
  handoff:JSON.parse(sessionStorage.getItem('dcc_yardage_caddy_handoff_v1')||'null'),
  wager:localStorage.getItem('dagger_foursome_active')
 }));
 // The composer may consume the one-time handoff immediately on returning.
 expect(JSON.parse(stored.wager)).toEqual({players:['Golfer','Friend'],format:'skins',stake:5,holes:[[4,5]],started:123});
});

test('Mapped tee-to-green pencil route labels both sides and informs caddy game plan',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:111,selection:{course:{provider:'opengolfapi',providerCourseId:'route-book-test',name:'Route Book Links',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:5800},holeNumber:1}}));
 });
 await page.route('https://api.opengolfapi.org/v1/courses/route-book-test/holes',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({holes:[{number:1,par:4,yardages:{white:410}}]})}));
 const polygon=(type,x)=>({type:'Feature',properties:{type,hole:1},geometry:{type:'Polygon',coordinates:[[[x-.00004,35],[x+.00004,35],[x+.00004,35.00004],[x-.00004,35]]]}});
 await page.route(url=>url.toString().startsWith('https://api.opengolfapi.org/api/v1/features?'),route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:[
  polygon('tee',-79),polygon('green',-79.002),
  polygon('bunker',-79.001),polygon('water',-79.0012)
 ]})}));
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('.field-sketch .route-mark')).toHaveCount(1);
 await expect(page.locator('.field-sketch .hazard-tag')).toHaveCount(2);
 await expect(page.locator('#pocketNoteOne')).not.toBeEmpty();
 await expect(page.locator('#pocketNoteTwo')).not.toBeEmpty();
});

test('Pencil sketch labels mapped water and bunkers and gives cautious caddy attack guidance',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'mapped-trouble-test',name:'Trouble Test Links',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6100},holeNumber:1}}));
 });
 await page.route('https://api.opengolfapi.org/v1/courses/mapped-trouble-test/holes',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({holes:[{number:1,par:4,yardages:{blue:420}},{number:2,par:3,yardages:{blue:160}}]})}));
 const polygon=(type,hole)=>({type:'Feature',properties:{type,hole},geometry:{type:'Polygon',coordinates:[[[-79,35],[-78.9999,35],[-78.9999,35.0001],[-79,35]]]}});
 await page.route(url=>url.toString().startsWith('https://api.opengolfapi.org/api/v1/features?'),route=>{
  const hole=Number(new URL(route.request().url()).searchParams.get('hole'));
  route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:hole===1?[polygon('water',1),polygon('bunker',1),polygon('green',1)]:[]})});
 });
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('.field-sketch svg polygon')).toHaveCount(3);
 await expect(page.locator('.field-sketch svg polygon')).toHaveCount(3);
 await expect(page.locator('#pocketNoteOne')).not.toBeEmpty();
 await expect(page.locator('#pocketNoteTwo')).not.toBeEmpty();
 await page.locator('#next').click();
 await expect(page.locator('#position')).toContainText('HOLE 2 / 18');
 await expect(page.locator('#pocketNoteOne')).not.toBeEmpty();
 await expect(page.locator('#pocketNoteTwo')).not.toBeEmpty();
});

test('Pencil Yardage Book follows selected caddy without inventing hole geometry',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dagger_selected_caddie',JSON.stringify('vinny'));
  // A selected course without mapped geometry must show a non-fictional pencil study.
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'pencil-no-geometry',name:'Pencil Test Course',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6000},holeNumber:1}}));
 });
 await page.route('https://api.opengolfapi.org/v1/courses/pencil-no-geometry/holes',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({holes:[]})}));
 await page.route(url=>url.toString().startsWith('https://api.opengolfapi.org/api/v1/features?'),route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:[]})}));
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('.paper')).toBeVisible();
 await expect(page.locator('#pocketCaddyName')).toContainText('Vinny');
 await expect(page.locator('#pocketNoteOne')).not.toBeEmpty();
 await expect(page.locator('.field-sketch')).toContainText('No hole-assigned mapped outlines');
 await expect(page.locator('#yards')).toContainText('Not verified');
 await page.locator('#next').click();
 await expect(page.locator('#position')).toContainText('HOLE 2 / 18');
});

test('Verified provider feature polygons appear as a pencil study without suggesting GPS pin',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:Date.now(),selection:{course:{provider:'opengolfapi',providerCourseId:'geometry-test',name:'Geometry Test',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6300},holeNumber:1}}));
 });
 await page.route('https://api.opengolfapi.org/v1/courses/geometry-test/holes',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({holes:[{number:1,par:4,yardages:{white:400}}]})}));
 await page.route(url=>url.toString().startsWith('https://api.opengolfapi.org/api/v1/features?'),route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:[{type:'Feature',properties:{type:'green',hole:1},geometry:{type:'Polygon',coordinates:[[[-79,35],[-78.9999,35],[-78.9999,35.0001],[-79,35]]]}}]})}));
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('#yards')).toContainText('400');
 await expect(page.locator('.field-sketch svg polygon')).toHaveCount(1);
 await expect(page.locator('.geometry-foot')).toContainText('No invented fairway');
 await page.locator('#next').click();
 await expect(page.locator('.field-sketch svg polygon')).toHaveCount(0);
 await expect(page.locator('.field-sketch')).toContainText('No hole-assigned mapped outlines');
});

test('Pencil map is readable and tappable with one hand using Green / Trouble filters',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:Date.now(),selection:{course:{provider:'opengolfapi',providerCourseId:'touch-map-test',name:'Touch Test',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6300},holeNumber:1}})));
 const coordinates=[[[-79,35],[-78.9999,35],[-78.9999,35.0001],[-79,35]]];
 await page.route(url=>url.toString().startsWith('https://api.opengolfapi.org/api/v1/features?'),route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:[
   {type:'Feature',properties:{type:'green',hole:1},geometry:{type:'Polygon',coordinates}},
   {type:'Feature',properties:{type:'bunker',hole:1},geometry:{type:'Polygon',coordinates}}
 ]})}));
 await page.goto('/playtest/yardage-preview.html?hole=1');
 const map=page.locator('.field-sketch');
 await expect(page.locator('#mapHole')).toHaveText('HOLE 1');
 await expect(page.locator('#mapPar')).toContainText('Par');
 expect(await page.evaluate(()=>{const map=document.querySelector('.field-sketch'),notes=document.querySelector('.pocket-note');return !!(map.compareDocumentPosition(notes)&Node.DOCUMENT_POSITION_FOLLOWING)})).toBe(true);
 await expect(map.locator('svg polygon')).toHaveCount(2);
 await expect(map.locator('.map-feature')).toHaveCount(2);
 await map.getByText('Explore the sketch',{exact:true}).click();
 const trouble=map.getByRole('button',{name:'Trouble'});
 const green=map.getByRole('button',{name:'Green',exact:true});
 expect((await trouble.boundingBox()).height).toBeGreaterThanOrEqual(44);
 await trouble.click();
 await expect(trouble).toHaveAttribute('aria-pressed','true');
 await expect(map.locator('.map-feature')).toHaveCount(1);
 await expect(map.locator('.map-feature')).toContainText(['Bunker']);
 await map.locator('.map-feature').click();
 await expect(map.locator('svg polygon.map-selected')).toHaveCount(1);
 await green.click();
 await expect(map.locator('.map-feature')).toContainText(['Green']);
 await map.getByRole('button',{name:'All',exact:true}).click();
 await expect(map.locator('.map-feature')).toHaveCount(2);
 await page.locator('#next').click();
 await expect(page.locator('#mapHole')).toHaveText('HOLE 2');
 await expect(map.locator('svg polygon')).toHaveCount(0);
 await expect(map).toContainText('No hole-assigned mapped outlines');
});

test('Rapid hole changes cancel stale map and cached return does not repeat a fetch',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:Date.now(),selection:{course:{provider:'opengolfapi',providerCourseId:'rapid-map-test',name:'Rapid Test',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6300},holeNumber:1}})));
 let holeOneRequests=0;
 await page.route(url=>url.toString().startsWith('https://api.opengolfapi.org/api/v1/features?'),async route=>{
  const hole=new URL(route.request().url()).searchParams.get('hole');
  if(hole==='1')holeOneRequests++;
  const polygon={type:'Feature',properties:{type:'green',hole:Number(hole)},geometry:{type:'Polygon',coordinates:[[[-79,35],[-78.9999,35],[-78.9999,35.0001],[-79,35]]]}};
  try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:[polygon]})})}catch{}
 });
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('.field-sketch svg polygon')).toHaveCount(1);
 expect(holeOneRequests).toBe(1);
 await page.locator('#next').click();
 await expect(page.locator('#mapHole')).toHaveText('HOLE 2');
 await expect(page.locator('.field-sketch svg polygon')).toHaveCount(1);
 await page.locator('#prev').click();
 await expect(page.locator('#mapHole')).toHaveText('HOLE 1');
 await expect(page.locator('.field-sketch svg polygon')).toHaveCount(1);
 expect(holeOneRequests).toBe(1);
});

test('Yardage Book prefills the Caddy with selected verified hole without auto-sending',async({page})=>{
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('dccHandoffFixture'))return;
  sessionStorage.setItem('dccHandoffFixture','1');
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:Date.now(),selection:{course:{provider:'opengolfapi',providerCourseId:'handoff-test',name:'Pines Test Course',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6300},holeNumber:3}}));
 });
 await page.route('https://api.opengolfapi.org/v1/courses/handoff-test/holes',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({holes:[{number:3,par:4,yardages:{white:412}}]})}));
 await page.goto('/playtest/yardage-preview.html?hole=3');
 await expect(page.locator('#yards')).toContainText('412');
 await page.locator('#askHoleCaddy').click();
 await expect(page).toHaveURL('http://127.0.0.1:8765/playtest/');
 const prompt=page.locator('#aiInput');

 await expect(prompt).toHaveValue(/Pines Test Course, hole 3/);
 await expect(prompt).toHaveValue(/412 yards from the White tee/);
 await expect(prompt).toHaveValue(/NOT my current distance to the pin/);
 await expect(page.locator('#aiSend')).toBeVisible();
 await expect(page.locator('body')).toHaveClass(/dcc-caddy-turn/);
 await expect(page.locator('#dccTurnName')).toContainText('Keith');
 await expect(page.locator('#dccBackToHole')).toBeVisible();
 await expect(page.locator('#dccTurnChangeCaddy')).toBeVisible();
 await expect(page.locator('#aiStatus')).toContainText(/Ready|backend|Connect|Unavailable/i);
 const pending=await page.evaluate(()=>sessionStorage.getItem('dcc_yardage_caddy_handoff_v1'));
 expect(pending).toBeNull();
 await page.locator('#dccBackToHole').click();
 await expect(page).toHaveURL(/yardage-preview[.]html[?]hole=3/);
 await expect(page.locator('#mapHole')).toContainText('HOLE 3');
});

test('Bayonet photographed club scorecard loads all 18 White tee holes without a provider fetch',async({page})=>{
 let providerCalls=0;
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:Date.now(),selection:{course:{provider:'opengolfapi',providerCourseId:'1c31d1fb-faa1-4d9f-80a2-f281982df126',name:'Bayonet at Puppy Creek',region:'Raeford, NC'},tee:{providerTeeId:'white',name:'White',totalYards:5752},holeNumber:1}}));
 });
 await page.route(url=>url.toString().includes('/v1/courses/1c31d1fb-faa1-4d9f-80a2-f281982df126/holes'),route=>{providerCalls++;return route.abort()});
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('#mapHole')).toContainText('HOLE 1');
 await expect(page.locator('#yards')).toContainText('433');
 await expect(page.locator('#par')).toContainText('5');
 await expect(page.locator('#strokeIndex')).toContainText('Men 7 / Women 1');
 await expect(page.locator('#mapYards')).toContainText('433 yds');
 await expect(page.locator('#source')).toHaveCount(0);
 await page.locator('#hole').selectOption('18');
 await expect(page.locator('#yards')).toContainText('450');
 await expect(page.locator('#strokeIndex')).toContainText('Men 18 / Women 2');
 expect(providerCalls).toBe(0);
});

test('Grounds score pulse reflects the paper scorecard without duplicating game or wager writes',async({page})=>{
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('dccPulseFixture'))return;
  sessionStorage.setItem('dccPulseFixture','1');
  const selectedAt=234567;
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt,selection:{course:{provider:'opengolfapi',providerCourseId:'pulse-fixture',name:'Pulse Test Course',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6000},holeNumber:1}}));
  const scores=Array(18).fill(null);scores[0]=5;scores[1]=3;
  localStorage.setItem('dcc_solo_scorecard_v1',JSON.stringify({version:1,identity:'pulse-fixture|white|'+selectedAt,hole:3,length:18,scores}));
  localStorage.setItem('dagger_foursome_active',JSON.stringify({players:['A','B'],format:'skins',stake:5,holes:[[4,5]],started:123}));
 });
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close())}
 await page.locator('#useAustin').click({timeout:5000});
 await page.locator('#tab-games').click();
 const pulse=page.locator('#dccScorePulse');
 await expect(pulse).toBeHidden();
 await expect(pulse.locator('#dccScorePulseProgress')).toHaveText('2/18 HOLES SCORED');
 await expect(pulse.locator('#dccScorePulseSummary')).toContainText('Pulse Test Course · White · 8 recorded strokes');
 const before=await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'));
 await page.locator('#tab-play').click();
 await page.locator('#dccHomeScorecard').click();
 await expect(page.locator('#dcc-paper-dialog')).toHaveAttribute('open','');
 await page.getByRole('button',{name:'Select hole 1, 5 strokes'}).click();
 await page.getByRole('button',{name:'Pencil 4 strokes for hole 1'}).click();
 await page.locator('#dcc-paper-dialog .dcc-paper-close').click();
 await page.locator('#tab-games').click();
 await expect(pulse.locator('#dccScorePulseSummary')).toContainText('7 recorded strokes');
 await expect(pulse.locator('#dccScorePulseRecent')).toContainText('H1: 4');
 expect(await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'))).toBe(before);
 await page.evaluate(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:234568,selection:{course:{provider:'opengolfapi',providerCourseId:'another-course',name:'Other Course',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6800},holeNumber:1}}));
  document.dispatchEvent(new CustomEvent('dcc:course-selected'));
 });
 await expect(pulse.locator('#dccScorePulseProgress')).toHaveText('0/18 HOLES SCORED');
 await expect(pulse.locator('#dccScorePulseSummary')).toContainText('Other Course · Blue · 0 recorded strokes');
 await expect(pulse.locator('#dccScorePulseRecent')).toHaveText('No scores entered yet.');
});

test('Ghost preview uses the selected course tee scorecard but never changes wager storage',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'ghost-test',name:'Ghost Test Links',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1}}));
  localStorage.setItem('dagger_foursome_active','{\"protected\":true}');
 });
 await page.route('https://api.opengolfapi.org/v1/courses/ghost-test/holes',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({holes:[{number:1,par:3,yardages:{blue:165}}]})}));
 await page.goto('/playtest/ghost-preview.html');
 await expect(page.locator('#summary')).toContainText('Ghost Test Links · Blue');
 await expect(page.locator('#summary')).toContainText('selected-tee par & yards verified');
 await expect(page.locator('#headline')).toContainText('Par 3');
 await page.locator('#next').click();
 await expect(page.locator('#traces path')).toHaveCount(2);
 expect(await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'))).toBe('{\"protected\":true}');
});

test('Live Games reaches Money Room setup without exposing retired wager form or rewriting paper strokes',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'test-course',name:'Test Course',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1}}));
  localStorage.setItem('dcc_solo_scorecard_v1',JSON.stringify({version:1,identity:'test-course|blue|123456',hole:2,length:18,scores:[4,...Array(17).fill(null)]}));
  localStorage.setItem('dagger_foursome_active',JSON.stringify({format:'skins',players:['Golfer','Friend'],roundIdentity:'test-course|blue|123456',stake:5,holes:[],started:123}));
 });
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());}
 await page.locator('#useAustin').click({timeout:5000});
 const before=await page.evaluate(()=>({
  paper:localStorage.getItem('dcc_solo_scorecard_v1'),
  game:localStorage.getItem('dagger_foursome_active')
 }));
 await page.locator('#tab-games').click({timeout:5000});
 await page.locator('#tab-play').click();
 await expect(page.locator('#dccClubhouseHome [data-dcc-go="money"]')).toBeVisible();
 await page.locator('#tab-play').click();
 await page.locator('#dccClubhouseHome [data-dcc-go="money"]').click();
 await expect(page.locator('#moneyRoomSection')).toBeAttached();
 await expect(page.locator('#tab-bets')).toHaveClass(/active/);
 await expect(page.locator('details.dcc-r60-legacy-ticket')).toBeHidden();
 const after=await page.evaluate(()=>({
  paper:localStorage.getItem('dcc_solo_scorecard_v1'),
  game:localStorage.getItem('dagger_foursome_active')
 }));
 expect(after).toEqual(before);
});

test('Selected course and tee survive opening the visible Money Room',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:4321,selection:{course:{provider:'opengolfapi',providerCourseId:'binding-test',name:'Binding Test Course',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6100},holeNumber:1}}));
 });
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());}
 await page.locator('#useAustin').click({timeout:5000});
 const original=await page.evaluate(()=>localStorage.getItem('dcc_active_round_course_v1'));
 await page.locator('#tab-games').click({timeout:5000});
 await page.locator('#tab-play').click();
 await page.locator('#dccClubhouseHome [data-dcc-go="money"]').click();
 await expect(page.locator('#moneyRoomSection')).toBeAttached();
 const current=await page.evaluate(()=>localStorage.getItem('dcc_active_round_course_v1'));
 expect(current).toBe(original);
 expect(JSON.parse(current).selection.tee.providerTeeId).toBe('white');
});

test('Games shortcut opens the existing Ticket Window without writing a bet',async({page})=>{
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());}
 await page.locator('#useAustin').click({timeout:5000});
 await page.locator('#tab-games').click({timeout:5000});
 const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/prop|bet|ledger|foursome/i.test(key))));
 await page.locator('#tab-bets').click();
 await expect(page.locator('#tab-bets')).toHaveClass(/active/);
 await expect(page.locator('#dccSimpleLedger')).toBeVisible();
 await expect(page.locator('#dccPropFormWrap')).not.toHaveAttribute('open','');
 await expect(page.locator('#dccPropNew')).toBeVisible();
 const after=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/prop|bet|ledger|foursome/i.test(key))));
 expect(after).toEqual(before);
});

test('Games Money Room shortcut opens existing live room without resetting stored match',async({page})=>{
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());}
 await page.locator('#useAustin').click({timeout:5000});
 await page.locator('#tab-games').click({timeout:5000});
 const record='{"protected":"existing-session","holes":{"1":[4,5]}}';
 await page.evaluate(value=>localStorage.setItem('dagger_active_money_room',value),record);
 await page.locator('#tab-play').click();
 await page.locator('#dccClubhouseHome [data-dcc-go="money"]').click();
 await expect(page.locator('#tab-bets')).toHaveClass(/active/);
 await expect(page.locator('#moneyRoomSection')).toBeAttached();
 expect(await page.evaluate(()=>localStorage.getItem('dagger_active_money_room'))).toBe(record);
});

test('Host QR uses secure room invitation and renders a scannable black-and-white canvas',async({page})=>{
 await page.goto('/playtest/');
 const result=await page.evaluate(async()=>{
  const {invitationFrom}=await import('./room-session.js');
  const {invitationMatrix,drawInvitationQr}=await import('./invitation-qr.js');
  const id='0123456789abcdef0123456789abcdef',code='0123456789abcdef';
  const url=new URL(window.location.href);
  url.searchParams.set('room',id);url.searchParams.set('invite',code);
  const canvas=document.createElement('canvas');
  const drawn=drawInvitationQr(canvas,url.href);
  const matrix=invitationMatrix(url.href);
  const ctx=canvas.getContext('2d');
  const corner=ctx.getImageData(0,0,1,1).data;
  let rejected=false;
  try{invitationMatrix('https://example.com/playtest/?room='+id+'&invite=INVALID');}catch{rejected=true;}
  return {
   parsed:invitationFrom(drawn.url),
   size:drawn.side,
   matrixSize:matrix.size,
   quietZoneWhite:corner[0]===255&&corner[1]===255&&corner[2]===255,
   rejectsInvalid:rejected,
   renderedWidth:canvas.width,
   renderedHeight:canvas.height
  };
 });
 expect(result.parsed).toEqual({id:'0123456789abcdef0123456789abcdef',code:'0123456789abcdef'});
 expect(result.matrixSize).toBeGreaterThan(20);
 expect(result.size).toBeGreaterThan(result.matrixSize);
 expect(result.renderedWidth).toBe(result.size);
 expect(result.renderedHeight).toBe(result.size);
 expect(result.quietZoneWhite).toBe(true);
 expect(result.rejectsInvalid).toBe(true);
});

test('Bayonet Blue notebook shows the supplied course routing and shares it with Ghost',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,
   selection:{course:{provider:'opengolfapi',providerCourseId:'1c31d1fb-faa1-4d9f-80a2-f281982df126',name:'Bayonet at Puppy Creek',region:'Raeford, NC'},
    tee:{providerTeeId:'blue',name:'Blue',totalYards:6281},holeNumber:1}}));
  localStorage.setItem('dagger_profile',JSON.stringify([{name:'Mini Driver',manualCarry:235}]));
 });
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('#courseTitle')).toHaveText('Bayonet at Puppy Creek');
 await expect(page.locator('#mapPar')).toHaveText('Par 5');
 await expect(page.locator('#mapYards')).toHaveText('471 yds');
 await expect(page.locator('.field-sketch svg')).toHaveAttribute('viewBox','0 0 300 440');
 await expect(page.locator('.field-sketch svg polygon')).toHaveCount(11);
 await expect(page.locator('#pocketNoteOne')).not.toBeEmpty();
 await expect(page.locator('#pocketNoteTwo')).not.toBeEmpty();
 const first=await page.locator('.field-sketch .route-mark').getAttribute('d');
 await page.screenshot({path:'candidate-screenshots/04-bayonet-book-iphone.png',fullPage:true,animations:'disabled'});
 await page.locator('#hole').selectOption('18');
 await expect(page.locator('#mapYards')).toHaveText('495 yds');
 await expect(page.locator('.field-sketch .route-mark')).not.toHaveAttribute('d',first);
 await page.locator('#hole').selectOption('1');
 await expect(page.locator('.field-sketch .route-mark')).toHaveAttribute('d',first);
 await page.locator('#watchGhost').click();
 await expect(page.locator('#ghostHoleSketch .route-mark')).toHaveAttribute('d',first);
 await expect(page.locator('#trail')).toHaveAttribute('viewBox','0 0 300 440');
 await page.locator('#next').click();
 await expect(page.locator('#traces .dcc-ghost-tracer')).toHaveCount(1);
 await page.screenshot({path:'candidate-screenshots/05-bayonet-ghost-iphone.png',fullPage:true,animations:'disabled'});
 await page.locator('#ghostBack').click();
 await expect(page.locator('#hole')).toHaveValue('1');
});

test('Ticket Window resolves and toggles payment without changing recorded outcome or net',async({page})=>{
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 await page.locator('#useAustin').click();
 await page.locator('#dccClubhouseHome [data-dcc-go="ticket"]').click();
 await expect(page.locator('#dccPropNew')).toHaveAttribute('aria-expanded','false');
 await page.locator('#dccPropNew').click();
 for(const [id,value] of [['dccPropText','QA tee shot'],['dccPropMe','Golfer'],['dccPropOther','Friend'],['dccPropStake','5'],['dccPropOdds','2']]){
  await page.locator('#'+id).fill(value);
 }
 await page.locator('#dccPropForm button[type="submit"]').click();
 const ticket=page.locator('#dccPropList article').filter({hasText:'QA tee shot'});
 await expect(ticket).toContainText('OPEN');
 page.on('dialog',dialog=>dialog.accept());
 await ticket.getByRole('button',{name:'YES happened'}).click();
 await expect(ticket).toContainText('UNSETTLED');
 await expect(page.locator('#dccPropTotal')).toHaveText('+$10.00');
 await expect(page.locator('#dccPropHistoryWrap')).toBeVisible();
 await ticket.getByRole('button',{name:'Mark paid',exact:true}).click();
 await expect(page.locator('#dccPropHistoryWrap')).toBeHidden();
 await expect(ticket).toContainText('marked paid');
 await expect(page.locator('#dccPropTotal')).toHaveText('+$10.00');
 await ticket.getByRole('button',{name:'Undo paid',exact:true}).click();
 await expect(ticket).toContainText('UNSETTLED');
 await expect(page.locator('#dccPropTotal')).toHaveText('+$10.00');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')));
 expect(saved).toHaveLength(1);
 expect(saved[0]).toMatchObject({result:'yes',settled:false,stake:5});
});

test('first Clubhouse load keeps late panels out and the Ledger opens a ready recap',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{
  localStorage.setItem('dagger_setup_complete','true');
  const selectedAt=123456;
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt,selection:{
   course:{provider:'opengolfapi',providerCourseId:'course',name:'Pines',region:'NC'},
   tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:3}}));
  localStorage.setItem('dcc_solo_scorecard_v1',JSON.stringify({
   version:1,identity:'course|blue|123456',hole:3,length:9,scores:[4,5,...Array(16).fill(null)]}));
 });
 await page.route('**/v1/courses/course/holes',route=>route.fulfill({json:{holes:[]}}));
 await page.goto('/playtest/');
 const home=page.locator('#dccClubhouseHome');
 await expect(home).toBeVisible();
 await expect(page.locator('#dccR86Clubhouse')).toBeAttached();
 await expect(page.locator('#dccGroundsDoors')).toHaveCount(0);
 for(const id of ['dccR86Clubhouse','clubRecordsSection','dcc19thHole']){
  await expect(page.locator('#'+id)).toBeHidden();
 }
 const book=home.locator('#dccHomeYardage');
 expect((await book.innerText()).match(/Yardage Book/gi)).toHaveLength(1);
 await expect(home.locator('.dcc-home-seal')).toHaveCSS('mix-blend-mode','lighten');
 await page.locator('#tab-games').click();
 await expect(page.locator('#dccGroundsDoors')).toHaveCount(0);
 await expect(page.locator('#dcc19thHole')).toBeHidden();
 await page.locator('#tab-bets').click();
 await page.locator('#dcc19thHole').click();
 await expect(page.locator('#result')).toContainText('Pines · Blue');
 await expect(page.locator('#result')).toContainText('9 strokes · 2 of 9 holes recorded');
 await expect(page.locator('input, textarea')).toHaveCount(0);
 await expect(page.locator('#copy')).toBeVisible();
 await page.getByRole('link',{name:'Back to The Ledger'}).click();
 await expect(page.locator('#tab-bets')).toHaveAttribute('aria-current','page');
});

test('House Ghost rival starts a match with automatic shared-hole playback and records the same score after reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{
  localStorage.setItem('dagger_setup_complete','true');
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,
   selection:{course:{provider:'opengolfapi',providerCourseId:'1c31d1fb-faa1-4d9f-80a2-f281982df126',name:'Bayonet at Puppy Creek',region:'Raeford, NC'},
    tee:{providerTeeId:'blue',name:'Blue',totalYards:6281},holeNumber:1}}));
 });
 await page.goto('/playtest/yardage-preview.html?hole=1');
 const route=await page.locator('.field-sketch .route-mark').getAttribute('d');
 await page.goto('/playtest/');
 const launch=page.locator('#dccClubhouseHome [data-dcc-go="ghost"]');
 await launch.click();
 const panel=page.locator('#dccR91SoloPanel');
 await expect(panel).toHaveAttribute('open','');
 await expect(page.locator('#dccGhostAutoPar')).toContainText('HOLE 1 · PAR 5');
 await expect(page.locator('#dccGhostManualPar')).toBeHidden();
 await page.locator('#dccGhostTier').selectOption('fiveTen');
 await page.locator('#dccGhostLength').selectOption('9');
 await page.locator('#dccGhostPlay').click();
 const frame=page.frameLocator('#dccGhostPlayback iframe');
 await expect(frame.locator('#ghostHoleSketch .route-mark')).toHaveAttribute('d',route);
 await expect(frame.locator('#headline')).toContainText('The Sandbagger · Hole 1 · Par 5');
 await expect(frame.locator('#traces .dcc-ghost-tracer').first()).toBeAttached();
 const draft=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')));
 const pending=(await draft()).pending;
 await expect(frame.locator('#shots li')).toHaveCount(pending.ghost,{timeout:15000});
 await expect(frame.locator('#headline')).toContainText('Ghost '+pending.ghost);
 // Regression: a vertical swipe over the finished animation must move the
 // surrounding page, rather than trapping the iPhone inside its iframe.
 await page.evaluate(()=>window.scrollTo(0,0));
 await frame.locator('body').evaluate(body=>{
  const touch=(y)=>new Touch({identifier:1,target:body,clientX:160,clientY:y});
  const start=touch(480),move=touch(370);
  body.dispatchEvent(new TouchEvent('touchstart',{touches:[start],targetTouches:[start],changedTouches:[start],bubbles:true}));
  body.dispatchEvent(new TouchEvent('touchmove',{touches:[move],targetTouches:[move],changedTouches:[move],cancelable:true,bubbles:true}));
  body.dispatchEvent(new TouchEvent('touchend',{touches:[],targetTouches:[],changedTouches:[move],bubbles:true}));
 });
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
 await page.locator('#dccGhostPlayback').scrollIntoViewIfNeeded();
 await page.screenshot({path:'candidate-screenshots/06-ghost-match-iphone.png',animations:'disabled'});
 await page.reload();
 await launch.click();
 await expect(page.locator('#dccGhostPlay')).toHaveText('Replay Hole 1');
 await expect(page.locator('#dccGhostTier')).toHaveValue('fiveTen');
 expect((await draft()).pending).toEqual(pending);
 await page.locator('#dccGhostPlayerScore').fill('5');
 await page.locator('#dccGhostRecord').click();
 expect((await draft()).holes).toEqual([{par:5,player:5,ghost:pending.ghost}]);
 expect((await draft()).pending).toBeUndefined();
 await expect(page.locator('#dccGhostPlay')).toHaveText('Watch Hole 2');
 await expect(page.locator('#dccGhostAutoPar')).toContainText('HOLE 2 · PAR 4');
 await expect(page.locator('#dccGhostManualPar')).toBeHidden();
});

test('A $1.25 Bingo game keeps one visible financial receipt and one Competition Archive entry',async({page})=>{
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#useAustin').click();
 await page.locator('#tab-games').click();
 await page.locator('#dccGameLibraryToggle').click();
 await page.locator('[data-game="bingo"]').click();
 await page.locator('#gP1').fill('Alice');
 await page.locator('#gP2').fill('Bob');
 await page.locator('#gStake').fill('1.25');
 await page.locator('#gStart').click();
 await page.locator('#gBingo').selectOption('0');
 await page.locator('#gBango').selectOption('1');
 await page.locator('#gBongo').selectOption('0');
 await page.locator('#gSave').click();
 page.on('dialog',dialog=>dialog.accept());
 await page.locator('#gFinish').click();
 await page.locator('#tab-bets').click();
 const settlement=page.locator('#dccRecordedSettlements > summary');
 const receipt=page.locator('#dccBbbArchiveReceipts article');
 await settlement.click();
 await expect(receipt).toHaveCount(1);
 await expect(receipt).toContainText('Alice 2 pts · +$1.25');
 await expect(receipt).toContainText('Bob 1 pts · −$1.25');
 await page.reload();
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#tab-bets').click();
 await settlement.click();
 await expect(receipt).toHaveCount(1);
 await page.locator('#dccLedgerArchive').click();
 await page.locator('#bbbArchivePanel > summary').click();
 await expect(page.locator('#dccSavedGamesPanel #gHistory > p')).toHaveCount(1);
});

test('Growing Games catalog stays compact until requested and works when opened',async({page})=>{
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#tab-games').click();
 await expect(page.locator('#gamesMenu')).toHaveAttribute('data-dcc-collapsed','true');
 await expect(page.locator('#dccGameChoices')).toBeHidden();
 await expect(page.locator('#dccGameLibraryCurrent')).toBeHidden();
 await expect(page.locator('#dccGameLibraryToggle')).toHaveText(/Browse 7 Games/);
 await expect(page.locator('#dccSavedGamesPanel > summary')).toBeVisible();
 await page.locator('#dccGameLibraryToggle').click();
 await expect(page.locator('#dccGameChoices')).toBeVisible();
 await expect(page.locator('#dccGameSearch')).toBeVisible();
 // Expand should not summon iOS keyboard: search receives focus only on tap.
 expect(await page.locator('#dccGameSearch').evaluate(el=>document.activeElement===el)).toBe(false);
 await page.locator('#dccGameSearch').click();
 expect(await page.locator('#dccGameSearch').evaluate(el=>document.activeElement===el)).toBe(true);
 await page.locator('#dccGameChoices [data-game="wolf"]').click();
 await expect(page.locator('#dccGameLibraryCurrent')).toContainText('Wolf');
 await expect(page.locator('#dccGameLibraryCurrent')).not.toContainText('Selected:');
 await page.locator('#dccGameLibraryToggle').click();
 await expect(page.locator('#dccGameChoices')).toBeHidden();
});
test('From the hole, Ask My Caddy preserves the hole and returns without writing a score',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dagger_selected_caddie',JSON.stringify('reginald'));
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'1c31d1fb-faa1-4d9f-80a2-f281982df126',name:'Bayonet at Puppy Creek',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:5752},holeNumber:7}}));
 });
 await page.goto('/playtest/yardage-preview.html?hole=7');
 await expect(page.locator('#mapHole')).toContainText('HOLE 7');
 await page.locator('#askHoleCaddy').click();
 await page.waitForURL('**/playtest/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#dccTurnName')).toContainText('Reginald');
 await expect(page.locator('#aiInput')).toBeVisible();
 await expect(page.locator('#dccClubhouseHome')).toBeHidden();
 await expect(page.locator('#aiHistory')).toBeVisible();
 await page.locator('#dccBackToHole').click();
 await expect(page).toHaveURL(/yardage-preview\.html\?hole=7/);
 await expect(page.locator('#mapHole')).toContainText('HOLE 7');
 const scored=await page.evaluate(()=>{const raw=localStorage.getItem('dcc_solo_scorecard_v1');return raw?JSON.parse(raw).scores.filter(v=>Number.isInteger(v)).length:0});
 expect(scored).toBe(0);
});

test('Kings Grant opens eighteen local drawings and shares the approximate tees with Ghost',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
 await page.route(url=>url.hostname==='api.opengolfapi.org'&&url.pathname.includes('/courses/search'),route=>route.abort());
 await page.goto('/playtest/');
 await page.evaluate(()=>{const dialog=document.getElementById('dcc-starter-dialog');if(!dialog.open)dialog.showModal()});
 await page.locator('#dcc-starter-query').fill('Kings Grant');
 await page.locator('#dcc-starter-search').click();
 await expect(page.locator('#dcc-starter-results')).toContainText('Fayetteville, NC');
 await page.locator('#dcc-starter-results button').first().click();
 await expect(page.locator('#dcc-starter-tees option')).toHaveCount(7);
 await page.locator('#dcc-starter-tees').selectOption('1');
 await page.locator('#dcc-starter-checkin').click();
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('#name')).toContainText('King');
 await expect(page.locator('#yards')).toContainText('376');
 await expect(page.locator('#mapPar')).toContainText('Par 4');
 await expect(page.locator('#pocketNoteOne')).not.toBeEmpty();
 const route=page.locator('.field-sketch .route-mark');
 const paths=new Set();
 let previous=null;
 for(let hole=1;hole<=18;hole++){
  await page.locator('#hole').selectOption(String(hole));
  if(previous)await expect(route).not.toHaveAttribute('d',previous);
  await expect(route).toHaveAttribute('d',/^M/);
  previous=await route.getAttribute('d');
  paths.add(previous);
 }
 expect(paths.size).toBe(18);
 await expect(page.locator('#yards')).toContainText('470');
 const fact=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_active_round_course_v1')));
 expect(fact.selection.course.provider).toBe('dagger-founder');
 expect(fact.selection.tee.providerTeeId).toBe('blue');
 for(const [hole,yards] of [[9,288],[13,132]]){
  await page.locator('#hole').selectOption(String(hole));
  const path=Array.from(paths)[hole-1];
  await expect(route).toHaveAttribute('d',path);
  await expect(page.locator('#yards')).toContainText(String(yards));
  await expect(page.locator('.field-sketch')).toContainText('TEE (APPROX.)');
  if(hole===13)await expect(page.locator('.field-sketch')).toContainText('Pond beyond green');
  await page.screenshot({path:`candidate-screenshots/kings-grant-${hole}-yardage-iphone.png`,fullPage:true});
  await page.locator('#watchGhost').click();
  const map=page.locator('#ghostHoleSketch');
  await expect(map.locator('.route-mark')).toHaveAttribute('d',path);
  await expect(map).toContainText('TEE (APPROX.)');
  await page.locator('#next').click();
  await expect(page.locator('#traces .dcc-ghost-tracer')).toHaveCount(1);
  await page.screenshot({path:`candidate-screenshots/kings-grant-${hole}-ghost-iphone.png`,fullPage:true});
  await page.locator('#ghostBack').click();
  await expect(page.locator('#hole')).toHaveValue(String(hole));
 }
});

test('Sanford Quail Ridge uses all eighteen local drawings and shares hole fourteen with House Ghost',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
 await page.route(url=>url.hostname==='api.opengolfapi.org'&&url.pathname.includes('/courses/search'),route=>route.abort());
 await page.goto('/playtest/');
 await page.evaluate(()=>{const dialog=document.getElementById('dcc-starter-dialog');if(!dialog.open)dialog.showModal()});
 await page.locator('#dcc-starter-query').fill('Quail Ridge');
 await page.locator('#dcc-starter-search').click();
 await expect(page.locator('#dcc-starter-results')).toContainText('Sanford, NC');
 await page.locator('#dcc-starter-results button').first().click();
 await expect(page.locator('#dcc-starter-tees option')).toHaveCount(5);
 await expect(page.locator('#dcc-starter-tees')).not.toContainText('Blue');
 await page.locator('#dcc-starter-tees').selectOption({label:'Black · 6783 yards'});
 await page.locator('#dcc-starter-checkin').click();
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('#yards')).toContainText('409');
 await expect(page.locator('#mapPar')).toContainText('Par 4');
 const route=page.locator('.field-sketch .route-mark');
 const drawings=new Set();
 for(let hole=1;hole<=18;hole++){
  await page.locator('#hole').selectOption(String(hole));
  const previous=drawings.size?Array.from(drawings).at(-1):null;
  if(previous)await expect(route).not.toHaveAttribute('d',previous);
  const path=await route.getAttribute('d');
  expect(path).toBeTruthy();
  drawings.add(path);
  await expect(page.locator('#pocketNoteOne')).not.toBeEmpty();
  await expect(page.locator('#pocketNoteTwo')).not.toBeEmpty();
 }
 expect(drawings.size).toBe(18);
 await expect(page.locator('#yards')).toContainText('399');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_active_round_course_v1')));
 expect(saved.selection.course.region).toBe('Sanford, NC');
 expect(saved.selection.tee.totalYards).toBe(6783);
 await page.locator('#hole').selectOption('14');
 await expect(page.locator('#mapPar')).toContainText('Par 5');
 await expect(page.locator('#yards')).toContainText('496');
 const map=page.locator('.field-sketch svg');
 await expect(map.locator('[fill-rule="evenodd"]')).toHaveCount(1);
 const before=await map.locator('.route-mark').getAttribute('d');
 const shapes=await map.locator('[data-map-feature]').evaluateAll(items=>items.map(node=>[node.getAttribute('d'),node.getAttribute('points')]));
 await page.screenshot({path:'candidate-screenshots/quail-ridge-14-yardage-iphone.png',fullPage:true});
 await page.locator('#watchGhost').click();
 const ghostMap=page.locator('#ghostHoleSketch');
 await expect(ghostMap.locator('.route-mark')).toHaveAttribute('d',before);
 expect(await ghostMap.locator('[data-map-feature]').evaluateAll(items=>items.map(node=>[node.getAttribute('d'),node.getAttribute('points')]))).toEqual(shapes);
 await page.locator('#next').click();
 await expect(page.locator('#traces .dcc-ghost-tracer')).toHaveCount(1);
 await expect(page.locator('#headline')).not.toContainText(/Ghost \d/);
 await page.screenshot({path:'candidate-screenshots/quail-ridge-14-ghost-iphone.png',fullPage:true});
 await page.locator('#ghostBack').click();
 await expect(page.locator('#hole')).toHaveValue('14');
});

for(const course of [
 {query:'The Chimneys',region:'Winder, GA',tee:'Gold',hole:11,yards:216,par:3},
 {query:'Pine Hills',region:'Winder, GA',tee:'Red',hole:18,yards:360,par:5},
 {query:'Ocean Course',region:'Kiawah Island, SC',tee:'Black',hole:16,yards:577,par:5},
]){
 test(`${course.query} opens eighteen distinct local maps and plays Ghost on the same drawing`,async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
  await page.route(url=>url.hostname==='api.opengolfapi.org'&&url.pathname.includes('/courses/search'),route=>route.abort());
  await page.goto('/playtest/');
  await page.evaluate(()=>{const dialog=document.getElementById('dcc-starter-dialog');if(!dialog.open)dialog.showModal()});
  await page.locator('#dcc-starter-query').fill(course.query);
  await page.locator('#dcc-starter-search').click();
  await expect(page.locator('#dcc-starter-results')).toContainText(course.region);
  await page.locator('#dcc-starter-results button').first().click();
  const options=page.locator('#dcc-starter-tees');
  const selected=options.locator('option').filter({hasText:new RegExp('^'+course.tee+' ·')});
  await expect(selected).toHaveCount(1);
  await options.selectOption(await selected.getAttribute('value'));
  await page.locator('#dcc-starter-checkin').click();
  await page.goto('/playtest/yardage-preview.html?hole=1');
  const route=page.locator('.field-sketch .route-mark');
  const paths=new Set();
  let previous=null;
  for(let number=1;number<=18;number++){
   await page.locator('#hole').selectOption(String(number));
   if(previous)await expect(route).not.toHaveAttribute('d',previous);
   await expect(route).toHaveAttribute('d',/^M/);
   previous=await route.getAttribute('d');
   paths.add(previous);
  }
  expect(paths.size).toBe(18);
  await page.locator('#hole').selectOption(String(course.hole));
  await expect(route).toHaveAttribute('d',Array.from(paths)[course.hole-1]);
  await expect(page.locator('#yards')).toContainText(String(course.yards));
  await expect(page.locator('#mapPar')).toContainText('Par '+course.par);
  await expect(page.locator('#pocketNoteOne')).not.toBeEmpty();
  await expect(page.locator('#pocketNoteTwo')).not.toBeEmpty();
  const shapeAttrs=items=>items.map(node=>[node.getAttribute('d'),node.getAttribute('points')]);
  const shapes=await page.locator('.field-sketch svg [data-map-feature]').evaluateAll(shapeAttrs);
  await page.locator('#watchGhost').click();
  const ghost=page.locator('#ghostHoleSketch');
  await expect(ghost.locator('.route-mark')).toHaveAttribute('d',Array.from(paths)[course.hole-1]);
  expect(await ghost.locator('[data-map-feature]').evaluateAll(shapeAttrs)).toEqual(shapes);
  await page.locator('#next').click();
  await expect(page.locator('#traces .dcc-ghost-tracer')).toHaveCount(1);
 });
}

test('Ghost only offers manual hole par when there is no verified course scorecard',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.evaluate(()=>document.getElementById('dcc-starter-dialog')?.close());
 await page.locator('#dccClubhouseHome [data-dcc-go="ghost"]').click();
 await expect(page.locator('#dccGhostManualPar')).toBeVisible();
 await expect(page.locator('#dccGhostAutoPar')).toBeHidden();
});
