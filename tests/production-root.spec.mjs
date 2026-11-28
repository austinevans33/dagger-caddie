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
  await expect(page.locator('.field-sketch .route-mark')).toHaveCount(1);
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

const rockTeeYards={
  gold:[430,440,518,343,241,310,330,217,501,384,381,223,512,355,194,648,312,389],
  blue:[411,425,518,328,219,310,330,176,485,360,372,203,500,345,180,608,312,389],
  green:[411,384,504,282,219,300,290,148,485,360,372,188,478,345,180,563,312,375],
  white:[372,384,504,282,190,300,290,148,445,332,360,188,478,345,147,563,301,375],
  red:[304,285,457,275,123,240,263,140,420,320,330,166,448,292,140,478,275,365],
};
rockTeeYards['red-par-3']=rockTeeYards.red.map((yards,i)=>i===3?108:yards);

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
    page.on('dialog',dialog=>dialog.accept());
    await checkInRock(page,teeLabel);
    const pars=[4,4,5,teeId==='red-par-3'?3:4,3,4,4,3,5,4,4,3,5,4,3,5,4,4];
    const book=await page.context().newPage();
    await book.goto(launch+'yardage-preview.html?hole=1');
    await expect(book.locator('#teeCaption')).toHaveText(teeLabel.split(' · ')[0]+' tees');
    for(let hole=1;hole<=18;hole++){
      await book.locator('#hole').selectOption(String(hole));
      await expect(book.locator('#mapPar')).toHaveText('Par '+pars[hole-1]);
      await expect(book.locator('#mapYards')).toHaveText(rockTeeYards[teeId][hole-1]+' yds');
    }
    await book.close();
    await openOriginalGhost(page);
    await page.locator('#dccGhostTier').selectOption(tier);
    const course=await page.evaluate(()=>localStorage.getItem('dcc_active_round_course_v1'));
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
      await expect(frame.locator('.route-mark')).toHaveCount(1);
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

test('a nine-hole Ghost match can start on 18 and resume across the turn', async ({page}) => {
  await checkInRock(page, 'Gold · 6728 yards');
  await openOriginalGhost(page);
  await page.locator('#dccGhostLength').selectOption('9');
  const start = page.locator('#dccGhostStartHole');
  await start.selectOption('18');
  await expect(page.locator('#dccGhostAutoPar')).toContainText('HOLE 18 · PAR 4');
  await page.locator('#dccGhostPlay').click();
  await expect(start).toBeDisabled();

  const frame = page.frameLocator('#dccGhostPlayback iframe');
  await expect(frame.locator('#headline')).toContainText('Hole 18 · Par 4');
  await page.reload();
  await openOriginalGhost(page);
  await expect(start).toHaveValue('18');
  await expect(start).toBeDisabled();
  await expect(frame.locator('#headline')).toContainText('Hole 18 · Par 4');
  const draft = () => page.evaluate(() => JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')));
  const {pending} = await draft();
  await page.locator('#dccGhostPlayerScore').fill(String(pending.ghost));
  await page.locator('#dccGhostRecord').click();
  await expect(page.locator('#dccGhostHistory')).toContainText('HOLE 18 · PAR 4');
  await expect(page.locator('#dccGhostAutoPar')).toContainText('HOLE 1 · PAR 4');
  expect((await draft()).holes[0].holeNumber).toBe(18);
  await page.locator('#dccGhostUndo').click();
  await expect(page.locator('#dccGhostAutoPar')).toContainText('HOLE 18 · PAR 4');
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
  await page.locator('#dccPropHole').fill('18');
  await page.locator('#dccPropOdds').fill('2');
  await page.locator('#dccPropForm button[type=submit]').click();
  const ticket=page.locator('#dccPropList article').first();
  await expect(ticket).toContainText('Hole 18');
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

test('a completed Ghost loss can be recorded through the existing manual ticket workflow',async ({page})=>{
  test.setTimeout(120000);
  await checkInRock(page,'Gold · 6728 yards');
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('[data-dcc-go="ticket"]').click();
  await page.locator('#dccPropNew').click();
  await page.locator('#dccPropText').fill('QA Ghost wins this Shining Rock match');
  await page.locator('#dccPropMe').fill('QA Golfer');
  await page.locator('#dccPropOther').fill('QA Partner');
  await page.locator('#dccPropStake').fill('5');
  await page.locator('#dccPropOdds').fill('1');
  await page.locator('#dccPropForm button[type=submit]').click();
  await openOriginalGhost(page);
  await page.locator('#dccGhostTier').selectOption('scratch');
  for(let hole=1;hole<=10;hole++){
    await page.locator('#dccGhostPlay').click();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1'))?.pending?.hole)).toBe(hole);
    const ghost=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')).pending.ghost);
    await page.locator('#dccGhostPlayerScore').fill(String(ghost+1));
    await page.locator('#dccGhostRecord').click();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1'))?.holes.length)).toBe(hole);
    await expect(page.locator('#dccGhostPosition')).toContainText(hole===10?'10&8':hole+' UP');
  }
  await expect(page.locator('#dccGhostRecord')).toBeDisabled();
  await page.locator('#tab-bets').click();
  const ticket=page.locator('#dccPropList article').first();
  // Ghost play records no financial result until the existing result action is used.
  await expect(ticket).toContainText('OPEN');
  await expect(page.locator('#dccSimpleNet')).toHaveText('$0.00');
  await ticket.locator('[data-result=yes]').click();
  await expect(ticket).toContainText('QA Partner owes QA Golfer $5.00');
  await expect(ticket).toContainText('UNSETTLED');
  await expect(page.locator('#dccSimpleNet')).toHaveText('+$5.00');
  const ledger=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')));
  const match=await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')));
  expect(ledger).toHaveLength(1);
  expect(ledger[0].settled).toBe(false);
  await page.reload();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')))).toEqual(ledger);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')))).toEqual(match);
});

test('all Shining Rock book pages share reviewed geometry with original Ghost playback',async ({page},testInfo)=>{
  test.setTimeout(120000);
  await checkInRock(page,'Gold · 6728 yards');
  for(let hole=1;hole<=18;hole++){
    await page.goto(launch+'yardage-preview.html?hole='+hole);
    await expect(page.locator('#mapYards')).toHaveText(rockTeeYards.gold[hole-1]+' yds');
    const route=page.locator('.field-sketch .route-mark');
    await expect(route).toHaveAttribute('d',/^M/);
    const geometry=await route.getAttribute('d');
    await expect(page.locator('.geometry-foot')).toContainText('unassigned');
    if(hole===18){
      await expect(page.locator('.geometry-foot')).toContainText('496');
      await expect(page.locator('.geometry-foot')).toContainText('389');
      await page.screenshot({path:testInfo.outputPath('shining-rock-18-yardage-book.png'),fullPage:true});
    }
    await page.locator('#watchGhost').click();
    await expect(page.locator('#headline')).toContainText('Hole '+hole+' ·', {timeout:12000});
    await expect(page.locator('#ghostHoleSketch .route-mark')).toHaveAttribute('d',geometry,{timeout:12000});
    await page.locator('#next').click();
    await expect(page.locator('#traces .dcc-ghost-tracer')).toHaveCount(1);
  }
});

test('a failed Shining Rock map download preserves scorecard and original Ghost fallback',async ({page})=>{
  await checkInRock(page,'Gold · 6728 yards');
  await page.route('**/course-art/shining-rock-northbridge-ma.json',route=>route.fulfill({status:404,body:'Unavailable'}));
  await page.goto(launch+'yardage-preview.html?hole=18');
  await expect(page.locator('#mapYards')).toHaveText('389 yds');
  await expect(page.locator('.field-sketch .route-mark')).toHaveCount(0);
  await page.locator('#watchGhost').click();
  await expect(page.locator('#headline')).toContainText('Par 4');
  await expect(page.locator('#ghostHoleSketch .route-mark')).toHaveCount(0);
  await page.locator('#next').click();
  await expect(page.locator('#progress')).toContainText('stroke');
});

test('Verdae uses the existing scorecard, Yardage Book, original Ghost and Ledger', async ({page})=>{
  test.setTimeout(120000);
  await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(launch);
  await page.locator('#dcc-starter-query').fill('Verdae');
  await page.locator('#dcc-starter-search').click();
  await page.locator('#dcc-starter-results button').filter({hasText:'Greenville, SC'}).click();
  const tee = page.locator('#dcc-starter-tees');
  for(const label of ['Black · 7104 yards','Blue · 6754 yards','White · 6226 yards','Gold · 5494 yards','Red · 5022 yards']){
    await expect(tee.locator('option').filter({hasText:label})).toHaveCount(1);
  }
  await tee.selectOption({label:'Black · 7104 yards'});
  await page.locator('#dcc-starter-checkin').click();
  await page.locator('#dccHomeScorecard').click();
  await page.getByRole('button',{name:'Pencil 4 strokes for hole 1'}).click();
  await page.reload();
  await page.locator('#dccHomeScorecard').click();
  await expect(page.getByRole('button',{name:'Select hole 1, 4 strokes'})).toBeVisible();
  await page.locator('#dcc-paper-dialog .dcc-paper-close').click();

  const book = await page.context().newPage();
  await book.goto(launch+'yardage-preview.html?hole=1');
  const pars = [4,3,4,4,5,3,4,4,5,4,3,4,4,5,3,4,4,5];
  const yards = [360,167,458,437,536,229,453,474,540,468,215,369,435,541,175,340,392,515];
  await expect(book.locator('#teeCaption')).toHaveText('Black tees');
  for(let hole=1;hole<=18;hole++){
    await book.locator('#hole').selectOption(String(hole));
    await expect(book.locator('#mapPar')).toHaveText('Par '+pars[hole-1]);
    await expect(book.locator('#mapYards')).toHaveText(yards[hole-1]+' yds');
    await expect(book.locator('.geometry-label')).toHaveText('Hole '+hole+' · Scorecard notes');
  }
  await book.close();

  await openOriginalGhost(page);
  await page.locator('#dccGhostStartHole').selectOption('1');
  for(let hole=1;hole<=18;hole++){
    await expect(page.locator('#dccGhostAutoPar')).toContainText('HOLE '+hole+' · PAR '+pars[hole-1]);
    await page.locator('#dccGhostPlay').click();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1'))?.pending?.hole)).toBe(hole);
    const pending = await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')).pending);
    if(hole===9){
      await page.reload();
      await openOriginalGhost(page);
      expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')).pending)).toEqual(pending);
    }
    const playback = page.frameLocator('#dccGhostPlayback iframe');
    await expect(playback.locator('#headline')).toContainText('Par '+pars[hole-1]);
    await expect(playback.locator('#ghostMapStatus')).toContainText('No mapped hole outlines available');
    await page.locator('#dccGhostPlayerScore').fill(String(pending.ghost));
    await page.locator('#dccGhostRecord').click();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1'))?.holes.length)).toBe(hole);
  }
  await expect(page.locator('#dccGhostProgress')).toContainText('MATCH COMPLETE · 18 OF 18');
  await page.locator('#dccGhostReset').click();
  const archives = await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_archive_v1')));
  expect(archives).toHaveLength(1);
  expect(archives[0].course).toContain('the-preserve-at-verdae-greenville-sc');
  expect(archives[0].holes.map(hole=>hole.par)).toEqual(pars);

  await page.locator('#tab-play').click();
  await page.locator('[data-dcc-go="ticket"]').click();
  await page.locator('#dccPropNew').click();
  await page.locator('#dccPropText').fill('QA Verdae round');
  await page.locator('#dccPropMe').fill('QA Golfer');
  await page.locator('#dccPropOther').fill('QA Opponent');
  await page.locator('#dccPropStake').fill('5');
  await page.locator('#dccPropOdds').fill('2');
  await page.locator('#dccPropForm button[type=submit]').click();
  const ticket = page.locator('#dccPropList article').first();
  await ticket.locator('[data-result=yes]').click();
  await expect(page.locator('#dccSimpleNet')).toHaveText('+$10.00');
  await ticket.locator('[data-paid="1"]').click();
  await expect(ticket).toContainText('marked paid');
});

test('shotgun solo check-in drives mid-round Ghost and local wager scoring by physical hole',async ({page})=>{
  page.on('dialog',dialog=>dialog.accept());
  await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
  await page.goto(launch);
  await page.locator('#dcc-starter-query').fill('Shining Rock');
  await page.locator('#dcc-starter-search').click();
  await page.locator('#dcc-starter-results button').filter({hasText:'The Rock'}).click();
  await page.locator('#dcc-starter-tees').selectOption({label:'Gold · 6728 yards'});
  await page.locator('#dcc-starter-start').selectOption('18');
  await page.locator('#dcc-starter-checkin').click();
  await page.locator('#dccHomeScorecard').click();
  await page.getByRole('button',{name:'Pencil 4 strokes for hole 18'}).click();
  await expect(page.locator('#dcc-paper-progress')).toContainText('HOLE 1');
  await page.locator('#dcc-paper-dialog .dcc-paper-close').click();
  await page.reload();
  await openOriginalGhost(page);
  await expect(page.locator('#dccGhostStartHole')).toHaveValue('1');
  await page.locator('#dccGhostStartHole').selectOption('18');
  await page.locator('#dccGhostPlay').click();
  await expect(page.frameLocator('#dccGhostPlayback iframe').locator('#headline')).toContainText('Hole 18 · Par 4');

  await page.locator('#tab-play').click();
  await page.locator('[data-dcc-go="ticket"]').click();
  const wager=page.locator('#newWagers');
  if(!await wager.evaluate(node=>node.open))await wager.locator('summary').click();
  await expect(page.locator('#wStartHole')).toHaveValue('1');
  await page.locator('#wStartHole').selectOption('18');
  await page.locator('#wFormat').selectOption('nassau');
  await page.locator('#wStart').click();
  await expect(page.locator('#wHole')).toHaveText('18');
  await page.locator('#dccPaperGamePlayer').selectOption('0');
  await page.locator('#dccPaperGameUse').click();
  await expect(page.locator('#ws0')).toHaveValue('4');
  await page.locator('#ws1').fill('5');
  await page.locator('#wSaveHole').click();
  await expect(page.locator('#wHole')).toHaveText('1');
  await expect(page.locator('#wLead')).toContainText('3 matches pending');
  await page.locator('#wFinish').click();
  await expect(page.locator('#wStatus')).toContainText('3 unsettled matches');
  await page.locator('#wUndoHole').click();
  await expect(page.locator('#wHole')).toHaveText('18');
  await page.reload();
  await page.locator('#tab-play').click();
  await page.locator('[data-dcc-go="ticket"]').click();
  if(!await wager.evaluate(node=>node.open))await wager.locator('summary').click();
  await expect(page.locator('#wHole')).toHaveText('18');
});

test('All Heart appears on the scorecard-only Verdae book and keeps the accepted challenge through reload',async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
  await page.goto(launch);
  await page.locator('#dcc-starter-query').fill('Verdae');
  await page.locator('#dcc-starter-search').click();
  await page.locator('#dcc-starter-results button').filter({hasText:'Greenville, SC'}).click();
  await page.locator('#dcc-starter-tees').selectOption({label:'Black · 7104 yards'});
  await page.locator('#dcc-starter-start').selectOption('12');
  await page.locator('#dcc-starter-checkin').click();
  // Pick an eligible draw in this isolated QA browser. The shipped UI has no force switch.
  await page.evaluate(async ()=>{
    const {naturalAllHeartGate}=await import('./app/61f9e9de0a/all-heart-journal.js');
    const key='dcc_active_round_course_v1',active=JSON.parse(localStorage.getItem(key));
    const prefix=active.selection.course.providerCourseId+'|'+active.selection.tee.providerTeeId+'|';
    for(let delta=1;delta<=1000;delta++){
      if(!naturalAllHeartGate(prefix+(active.selectedAt+delta),12))continue;
      active.selectedAt+=delta;
      localStorage.setItem(key,JSON.stringify(active));
      return;
    }
    throw Error('Could not qualify a deterministic test draw');
  });
  await page.reload();
  await page.locator('#dccHomeScorecard').click();
  const moment=page.getByRole('region',{name:'All Heart Moment'});
  await expect(moment).toContainText('ALL HEART. NO EXCUSES.');
  await moment.getByRole('button',{name:'Take the challenge'}).click();
  await expect(page.getByRole('region',{name:'Accepted All Heart challenge'})).toContainText('Target 4 strokes');
  await page.reload();
  await page.locator('#dccHomeScorecard').click();
  await expect(page.getByRole('region',{name:'Accepted All Heart challenge'})).toContainText('Hole 12');
  await page.getByRole('button',{name:'Pencil 4 strokes for hole 12'}).click();
  await page.getByText('All Heart Club Record',{exact:true}).click();
  await expect(page.locator('#dccAllHeartRecord li')).toContainText('Hole 12 · MATCHED THE CHALLENGE. 4 strokes');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')||'[]'))).toEqual([]);
});
test('previously reviewed NC courses expose real art or an honest scorecard fallback',async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
  await page.goto(launch);
  await page.locator('#dcc-starter-query').fill('The Woods Golf Club');
  await page.locator('#dcc-starter-search').click();
  await page.locator('#dcc-starter-results button').filter({hasText:'Whispering Pines, NC'}).click();
  await page.locator('#dcc-starter-tees').selectOption({label:'Oak · 6070 yards'});
  await page.locator('#dcc-starter-checkin').click();
  await page.locator('#dccHomeScorecard').click();
  await page.getByRole('button',{name:'Pencil 4 strokes for hole 1'}).click();
  await page.locator('#dcc-paper-dialog .dcc-paper-close').click();
  await page.goto(launch+'yardage-preview.html?hole=1');
  await expect(page.locator('#mapYards')).toHaveText('362 yds');
  const sketch=page.locator('.field-sketch .route-mark');
  await expect(sketch).toHaveCount(1);
  const route=await sketch.getAttribute('d');
  await page.locator('#watchGhost').click();
  await expect(page.locator('#ghostHoleSketch .route-mark')).toHaveAttribute('d',route);
  await page.locator('#next').click();
  await expect(page.locator('#traces .dcc-ghost-tracer')).toHaveCount(1);
});

test('Country Hills plays from the official tee card using the reviewed drawing', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('dagger_setup_complete', 'true'));
  await page.goto(launch);
  await page.locator('#dcc-starter-query').fill('Country Hills Golf Course');
  await page.locator('#dcc-starter-search').click();
  await page.locator('#dcc-starter-results button').filter({hasText:'Gibsonville, NC'}).click();
  await page.locator('#dcc-starter-tees').selectOption({label:'Blue · 5873 yards'});
  await page.locator('#dcc-starter-checkin').click();
  await page.locator('#dccHomeScorecard').click();
  await page.getByRole('button', {name:'Pencil 4 strokes for hole 1'}).click();
  await page.locator('#dcc-paper-dialog .dcc-paper-close').click();
  await page.goto(launch + 'yardage-preview.html?hole=1');
  await expect(page.locator('#mapYards')).toHaveText('385 yds');
  const sketch = page.locator('.field-sketch .route-mark');
  await expect(sketch).toHaveCount(1);
  const route = await sketch.getAttribute('d');
  await page.locator('#watchGhost').click();
  await expect(page.locator('#ghostHoleSketch .route-mark')).toHaveAttribute('d', route);
  await page.locator('#next').click();
  await expect(page.locator('#traces .dcc-ghost-tracer')).toHaveCount(1);
});
for (const course of [
  {query:'Seven Lakes Golf Club', region:'West End, NC', tee:'Black · 6856 yards', hole:16, par:3, yards:188},
  {query:'Pine Island Country Club', region:'Charlotte, NC', tee:'Blue · 6377 yards', hole:2, par:5, yards:493},
]) {
  test(course.query + ' uses its verified card and Ghost while geometry is withheld', async ({page}) => {
    await page.addInitScript(() => localStorage.setItem('dagger_setup_complete', 'true'));
    await page.goto(launch);
    await page.locator('#dcc-starter-query').fill(course.query);
    await page.locator('#dcc-starter-search').click();
    await page.locator('#dcc-starter-results button').filter({hasText:course.region}).click();
    await page.locator('#dcc-starter-tees').selectOption({label:course.tee});
    await page.locator('#dcc-starter-checkin').click();
    await page.goto(launch + 'yardage-preview.html?hole=' + course.hole);
    await expect(page.locator('#mapYards')).toHaveText(course.yards + ' yds');
    await expect(page.locator('#mapPar')).toHaveText('Par ' + course.par);
    await expect(page.locator('.geometry-label')).toHaveText('Hole ' + course.hole + ' · Scorecard notes');
    await page.locator('#watchGhost').click();
    await expect(page.locator('#headline')).toContainText('Hole ' + course.hole + ' · Par ' + course.par);
    await expect(page.locator('#ghostMapStatus')).toContainText('No mapped hole outlines available');
    await page.locator('#next').click();
    await expect(page.locator('#traces .dcc-ghost-tracer')).toHaveCount(1);
  });
}
test('Sawgrass 17 shows the sourced exact-hole Legend and writes the Club Record', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('dagger_setup_complete', 'true'));
  await page.goto(launch);
  await page.locator('#dcc-starter-query').fill('TPC Sawgrass');
  await page.locator('#dcc-starter-search').click();
  await page.locator('#dcc-starter-results button').filter({hasText:'Ponte Vedra Beach, FL'}).click();
  await page.locator('#dcc-starter-tees').selectOption({label:'The Players · 7245 yards'});
  await page.locator('#dcc-starter-start').selectOption('17');
  await page.locator('#dcc-starter-checkin').click();
  await page.evaluate(async () => {
    const {naturalAllHeartGate} = await import('./app/61f9e9de0a/all-heart-journal.js');
    const key = 'dcc_active_round_course_v1', active = JSON.parse(localStorage.getItem(key));
    const prefix = active.selection.course.providerCourseId + '|' + active.selection.tee.providerTeeId + '|';
    for (let delta = 1; delta <= 1000; delta++) {
      if (!naturalAllHeartGate(prefix + (active.selectedAt + delta),17)) continue;
      active.selectedAt += delta;
      localStorage.setItem(key, JSON.stringify(active));
      return;
    }
    throw Error('Could not qualify a deterministic test draw');
  });
  await page.reload();
  await page.locator('#dccHomeScorecard').click();
  const moment = page.getByRole('region',{name:'All Heart Moment'});
  await expect(moment).toContainText('Tiger Woods made 2 here');
  await moment.getByRole('button',{name:'Take the challenge'}).click();
  await expect(page.getByRole('region',{name:'Accepted All Heart challenge'})).toContainText('Target 2 strokes');
  await page.getByRole('button',{name:'Pencil 2 strokes for hole 17'}).click();
  await page.getByText('All Heart Club Record',{exact:true}).click();
  await expect(page.locator('#dccAllHeartRecord li')).toContainText('Hole 17 · MATCHED THE CHALLENGE. 2 strokes');
});
test('Caddy shot logging keeps measured dispersion separate from target yardage',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('dagger_profile',JSON.stringify([{name:'7 Iron',n:3,carry:155}])));
  await checkInRock(page,'Gold · 6728 yards');
  await page.goto(launch+'yardage-preview.html?hole=1');
  await page.waitForFunction(()=>typeof document.getElementById('askHoleCaddy')?.onclick==='function');
  await page.locator('#askHoleCaddy').click();
  await expect(page.locator('#aiInput')).toBeVisible();
  await page.locator('#dccTurnShotLog').click();
  await page.getByText('Add launch-monitor measurements',{exact:true}).click();
  await page.locator('#aiShotClub').selectOption('7 Iron');
  for(const [carry,lateral] of [[155,-8],[159,0],[161,6]]){
    await page.locator('#aiShotYards').fill('175');
    await page.locator('#dccMeasuredCarry').fill(String(carry));
    await page.locator('#dccMeasuredLateral').fill(String(lateral));
    await page.locator('#aiShotQuality [data-quality="Good"]').click();
    await page.locator('#aiRecordShot').click();
  }
  await expect(page.locator('.dcc-shot-measurements [role="status"]')).toHaveText('3 measured shots · Carry 155–161 yd · Lateral -8 to 6 yd');
  const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('dagger_shot_log')));
  expect(records.map(row=>row.yards)).toEqual([175,175,175]);
  expect(records.map(row=>row.measurement.carryYards)).toEqual([155,159,161]);
  expect(records.every(row=>Number.isSafeInteger(row.courseContext?.roundSelectedAt))).toBe(true);
});
