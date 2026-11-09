import {test, expect} from '@playwright/test';

const launch = '/dagger-caddie/';
const runtime = './app/61f9e9de0a/';

test.use({baseURL:'http://127.0.0.1:8766', viewport:{width:390,height:844}, serviceWorkers:'block'});
test.beforeEach(async ({page})=>{
  await page.route('**/*', route=>{
    const url=new URL(route.request().url());
    return url.origin==='http://127.0.0.1:8766' || url.hostname==='www.gstatic.com'
      ? route.continue() : route.abort();
  });
});

test('installed root and manifest entry use the same release and production Firebase',async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
  for(const url of [launch,launch+'index.html']){
    await page.goto(url);
    await expect(page.locator('#dccHomeYardage')).toBeAttached();
    await expect(page.locator('link[rel=manifest]')).toHaveAttribute('href','manifest.json');
    await expect(page.locator('link[rel=apple-touch-icon]')).toHaveAttribute('href','dcc-icon-192.png');
    await expect(page.locator('#dccClubhouseHome img.dcc-home-seal')).toHaveAttribute('src','dcc-approved-seal.png');
    const result=await page.evaluate(async prefix=>{
      const {firebaseConfig}=await import(prefix+'firebase-config.js');
      const {invitationFrom}=await import(prefix+'room-session.js');
      const {invitationMatrix}=await import(prefix+'invitation-qr.js');
      const {founderCatalogRecords}=await import(prefix+'founders-verified-scorecards.js');
      const link=new URL(location.href);
      link.searchParams.set('room','0123456789abcdef0123456789abcdef');
      link.searchParams.set('invite','0123456789abcdef');
      return {project:firebaseConfig.projectId,invite:invitationFrom(link.href),
        qr:invitationMatrix(link.href).size,ryder:founderCatalogRecords('Ryder').length};
    },runtime);
    expect(result).toMatchObject({project:'dagger-caddie-money-room',
      invite:{id:'0123456789abcdef0123456789abcdef',code:'0123456789abcdef'},ryder:0});
    expect(result.qr).toBeGreaterThan(20);
  }
});

test('same-origin upgrade and return preserve legacy scores, profile and game storage',async ({page})=>{
  // Seed with the legacy modules shipped at these existing URLs.
  await page.goto(launch+'manifest.json');
  const preserved=await page.evaluate(async ()=>{
    const {saveActiveRound}=await import('./starters-desk-session.js');
    const {saveSoloScore}=await import('./solo-scorecard.js');
    const {rememberRoom}=await import('./room-recovery.js');
    const selection={course:{provider:'opengolfapi',providerCourseId:'fixture-legacy',name:'Legacy Fixture',region:'NC'},
      tee:{providerTeeId:'white',name:'White',totalYards:6100},holeNumber:1};
    saveActiveRound(localStorage,selection,123456);
    saveSoloScore(localStorage,4);
    rememberRoom(localStorage,{uid:'existing-uid',id:'0123456789abcdef0123456789abcdef',invite:'0123456789abcdef',name:'Member'});
    const entries={dagger_setup_complete:true,dagger_members_v48:[{id:'existing',name:'Member'}],
      dagger_member_active_v48:'existing',dagger_profile:[{name:'7 Iron',n:3,carry:155}],
      dagger_foursome_active:{players:['Member','Friend'],format:'skins',stake:5,holes:[[4,5]],started:123},
      dagger_bbb_history:[],dagger_room_archives:[],dagger_hole_notes:{'legacy fixture|1':'Play center'}};
    for(const [key,value] of Object.entries(entries))localStorage.setItem(key,key==='dagger_member_active_v48'?value:JSON.stringify(value));
    const keys=[...Object.keys(entries),'dcc_active_round_course_v1','dcc_solo_scorecard_v1','dagger_active_money_room'];
    return Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]));
  });
  expect(JSON.parse(preserved.dcc_solo_scorecard_v1).scores[0]).toBe(4);
  await page.goto(launch);
  await expect(page.locator('#dccHomeYardage')).toBeAttached();
  const compatibility=await page.evaluate(async prefix=>{
    const {readActiveRound}=await import(prefix+'starters-desk-session.js');
    const {readSoloCard}=await import(prefix+'solo-scorecard.js');
    const {readRoomBookmark}=await import(prefix+'room-recovery.js');
    return {course:readActiveRound(localStorage)?.selection.course.name,
      score:readSoloCard(localStorage)?.scores[0],
      room:readRoomBookmark(localStorage,'existing-uid')?.name};
  },runtime);
  expect(compatibility).toEqual({course:'Legacy Fixture',score:4,room:'Member'});
  await page.goto(launch+'yardage-preview.html');
  await expect(page.locator('#name')).toContainText('Legacy Fixture');
  await page.locator('#return').click();
  await expect(page).toHaveURL('http://127.0.0.1:8766'+launch);
  await page.reload();
  expect(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(preserved))).toEqual(preserved);
});

test('root course routes open shared art and carry verified facts to Caddy',async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
  await page.goto(launch);
  await page.evaluate(()=>{const desk=document.getElementById('dcc-starter-dialog');if(!desk.open)desk.showModal();});
  await page.locator('#dcc-starter-query').fill('Oak Island');
  await page.locator('#dcc-starter-search').click();
  await expect(page.locator('#dcc-starter-results')).toContainText('Caswell Beach');
  await page.locator('#dcc-starter-results button').first().click();
  await page.locator('#dcc-starter-tees').selectOption({label:'Red · 4903 yards'});
  await page.locator('#dcc-starter-checkin').click();
  await page.goto(launch+'yardage-preview.html?hole=14');
  await expect(page.locator('#yards')).toContainText('262');
  await expect(page.locator('#mapPar')).toContainText('Par 4');
  const route=page.locator('.field-sketch .route-mark');
  await expect(route).toHaveAttribute('d',/^M/);
  const geometry=await route.getAttribute('d');
  await page.locator('#watchGhost').click();
  await expect(page.locator('#ghostHoleSketch .route-mark')).toHaveAttribute('d',geometry);
  await page.locator('#next').click();
  await expect(page.locator('#traces .dcc-ghost-tracer')).toHaveCount(1);
  await page.locator('#ghostBack').click();
  await page.locator('#askHoleCaddy').click();
  await expect(page.locator('#aiInput')).toHaveValue(/Oak Island.*hole 14.*262 yards/i);
  await expect(page).toHaveURL('http://127.0.0.1:8766'+launch);
});
