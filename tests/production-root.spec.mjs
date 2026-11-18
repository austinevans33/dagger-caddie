import {test, expect} from '@playwright/test';

test.describe.configure({mode:'parallel'});

const launch = '/dagger-caddie/';
const runtime = './app/61f9e9de0a/';

test.use({baseURL:'http://127.0.0.1:8766', viewport:{width:390,height:844}, serviceWorkers:'block'});
test.use({actionTimeout:6000,navigationTimeout:12000});
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
  const fixture=launch+'legacy-fixture.html';
  await page.route('**'+fixture, route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Legacy fixture</title>'}));
  await page.goto(fixture);
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
  const back=page.locator('#ghostBack');
  await expect(back).toHaveAttribute('href','yardage-preview.html?hole=14');
  await back.click();
  await expect(page.locator('#hole')).toHaveValue('14');
  await expect(page.locator('#yards')).toContainText('262');
  await page.waitForFunction(()=>typeof document.getElementById('askHoleCaddy')?.onclick==='function');
  await page.locator('#askHoleCaddy').click();
  await page.waitForURL('http://127.0.0.1:8766'+launch,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#aiInput')).toHaveValue(/Oak Island.*hole 14.*262 yards/i);
});

test('Shining Rock check-in, Red alternate par, save, correction and reload at phone width',async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(launch);
  await expect(page.locator('#dcc-starter-dialog')).toBeVisible();
  await page.locator('#dcc-starter-query').fill('Shining Rock');
  await page.locator('#dcc-starter-search').click();
  await page.locator('#dcc-starter-results button').filter({hasText:'The Rock'}).click();
  await page.locator('#dcc-starter-tees').selectOption({label:'Red (No. 4 par 3) · 5154 yards'});
  await page.locator('#dcc-starter-checkin').click();
  await page.locator('#dccHomeScorecard').click();
  await page.getByRole('button',{name:'Pencil 4 strokes for hole 1'}).click();
  await page.getByRole('button',{name:'Select hole 1, 4 strokes'}).click();
  await page.getByRole('button',{name:'Pencil 5 strokes for hole 1'}).click();
  await page.reload();
  await page.locator('#dccHomeScorecard').click();
  await expect(page.getByRole('button',{name:'Select hole 1, 5 strokes'})).toBeVisible();
  await expect(page.locator('#dcc-paper-progress')).toContainText('HOLE 2');
  await page.goto(launch+'yardage-preview.html?hole=4');
  await expect(page.locator('#name')).toContainText('Shining Rock');
  await expect(page.locator('#yards')).toContainText('108');
  await expect(page.locator('#mapPar')).toContainText('Par 3');
  await expect(page.locator('.field-sketch .route-mark')).toHaveCount(0);
  await page.locator('#watchGhost').click();
  await expect(page.locator('#headline')).toContainText('Par 3');
});

async function checkInRock(page, teeLabel) {
  await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
  await page.goto(launch);
  await page.locator('#dcc-starter-query').fill('Shining Rock');
  await page.locator('#dcc-starter-search').click();
  await page.locator('#dcc-starter-results button').filter({hasText:'The Rock'}).click();
  await page.locator('#dcc-starter-tees').selectOption({label:teeLabel});
  await page.locator('#dcc-starter-checkin').click();
}

async function openOriginalGhost(page) {
  await page.locator('#tab-games').click();
  const solo=page.locator('#dccR91SoloPanel');
  if(!await solo.evaluate(node=>node.open)) await solo.locator('summary').first().click();
  await expect(page.locator('#dccGhostTier')).toBeVisible();
}

for(const [teeLabel,teeId,tier] of [
  ['Gold · 6728 yards','gold','scratch'],
  ['Blue · 6471 yards','blue','fiveTen'],
  ['Green · 6196 yards','green','tenFifteen'],
  ['White · 6004 yards','white','fifteenTwenty'],
  ['Red (No. 4 par 4) · 5321 yards','red','tenFifteen'],
  ['Red (No. 4 par 3) · 5154 yards','red-par-3','scratch'],
]) {
  test('original Ghost completes 18 Shining Rock holes on '+teeId,async ({page},testInfo)=>{
    test.setTimeout(180000);
    await checkInRock(page,teeLabel);
    await openOriginalGhost(page);
    await page.locator('#dccGhostTier').selectOption(tier);
    const course=await page.evaluate(()=>localStorage.getItem('dcc_active_round_course_v1'));
    const pars=[4,4,5,teeId==='red-par-3'?3:4,3,4,4,3,5,4,4,3,5,4,3,5,4,4];
    for(let hole=1;hole<=18;hole++){
      await expect(page.locator('#dccGhostAutoPar')).toContainText('HOLE '+hole+' · PAR '+pars[hole-1]);
      await page.locator('#dccGhostPlay').click();
      await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1'))?.pending?.hole)).toBe(hole);
      const pending=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')).pending);
      expect(pending.par).toBe(pars[hole-1]);
      if(hole===4){
        await page.reload();
        await openOriginalGhost(page);
        expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')).pending)).toEqual(pending);
      }
      const frame=page.frameLocator('#dccGhostPlayback iframe');
      await expect(frame.locator('#headline')).toContainText('Par '+pars[hole-1]);
      await expect(frame.locator('.route-mark')).toHaveCount(0);
      // Record a halved hole to exercise all 18, regardless of random opponent form.
      await page.locator('#dccGhostPlayerScore').fill(String(pending.ghost));
      await page.locator('#dccGhostRecord').click();
      await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1'))?.holes.length)).toBe(hole);
      await expect(page.locator('#dccGhostTier')).toBeDisabled();
      await expect(page.locator('#dccGhostPosition')).toContainText(/ALL SQUARE|HALVED/i);
      if(hole===9 || hole===18){
        await page.reload();
        await openOriginalGhost(page);
      }
    }
    const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')));
    expect(draft.course).toBe(course);
    expect(draft.tier).toBe(tier);
    expect(draft.holes.map(h=>h.par)).toEqual(pars);
    expect(draft.holes.every(h=>h.player===h.ghost)).toBe(true);
    await expect(page.locator('#dccGhostProgress')).toContainText('MATCH COMPLETE · 18 OF 18');
    await expect(page.locator('#dccGhostRecord')).toBeDisabled();
    await page.screenshot({path:testInfo.outputPath('ghost-'+teeId+'.png'),fullPage:true});
    await page.locator('#dccGhostReset').click();
    const archived=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_archive_v1')));
    expect(archived).toHaveLength(1);
    expect(archived[0].holes).toEqual(draft.holes);
    expect(archived[0].course).toBe(course);
    expect(archived[0].result).toMatchObject({lead:0,played:18});
    await page.reload();
    await openOriginalGhost(page);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_archive_v1')))).toEqual(archived);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')).holes)).toEqual([]);
  });
}

test('direct Ghost recording freezes Shining Rock context and rejects a double submit',async ({page})=>{
  await checkInRock(page,'Red (No. 4 par 3) · 5154 yards');
  await openOriginalGhost(page);
  const course=await page.evaluate(()=>localStorage.getItem('dcc_active_round_course_v1'));
  for(let hole=1;hole<=4;hole++){
    await expect(page.locator('#dccGhostAutoPar')).toContainText('HOLE '+hole);
    await page.locator('#dccGhostPlayerScore').fill('4');
    await page.evaluate(()=>{
      const button=document.getElementById('dccGhostRecord');
      button.click();button.click();
    });
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1'))?.holes.length)).toBe(hole);
  }
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')));
  expect(draft.course).toBe(course);
  expect(draft.holes[3].par).toBe(3);
  await page.reload();
  await openOriginalGhost(page);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')))).toEqual(draft);
});

test('existing local ticket resolves manually and requires explicit payment confirmation',async ({page,browser})=>{
  await checkInRock(page,'Gold · 6728 yards');
  let confirmPayment=false;
  page.on('dialog',dialog=>dialog.message().includes('actually been paid')&&!confirmPayment?dialog.dismiss():dialog.accept());
  await page.locator('[data-dcc-go="ticket"]').click();
  await page.locator('#dccPropNew').click();
  await page.locator('#dccPropText').fill('QA Shining Rock Ghost match');
  await page.locator('#dccPropMe').fill('QA Golfer');
  await page.locator('#dccPropOther').fill('QA Opponent');
  await page.locator('#dccPropStake').fill('5');
  await page.locator('#dccPropOdds').fill('2');
  await page.locator('#dccPropForm button[type=submit]').click();
  const ticket=page.locator('#dccPropList article').first();
  await expect(ticket).toContainText('OPEN');
  await expect(page.locator('#dccSimpleNet')).toHaveText('$0.00');
  // Independent phone storage proves the supported local ticket has no remote acceptance.
  const other=await browser.newContext({viewport:{width:390,height:844}});
  const otherPage=await other.newPage();
  await otherPage.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin==='http://127.0.0.1:8766'||url.hostname==='www.gstatic.com'?route.continue():route.abort();
  });
  await checkInRock(otherPage,'Gold · 6728 yards');
  expect(await otherPage.evaluate(()=>JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')||'[]'))).toEqual([]);
  await other.close();
  await ticket.locator('[data-result=yes]').click();
  await expect(ticket).toContainText('QA Opponent owes QA Golfer $10.00');
  await expect(page.locator('#dccSimpleNet')).toHaveText('+$10.00');
  await expect(ticket).toContainText('UNSETTLED');
  const resolved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')));
  expect(resolved).toHaveLength(1);
  expect(resolved[0].settled).toBe(false);
  await ticket.locator('[data-paid="1"]').click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')))).toEqual(resolved);
  confirmPayment=true;
  await ticket.locator('[data-paid="1"]').click();
  await expect(ticket).toContainText('marked paid');
  await expect(page.locator('#dccSimpleNet')).toHaveText('+$10.00');
  const paid=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')));
  expect(paid).toHaveLength(1);
  expect(paid[0].settled).toBe(true);
  expect(paid[0].settledAt).toBeTruthy();
  await page.reload();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')))).toEqual(paid);
});
