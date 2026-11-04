import {test,expect} from '@playwright/test';
test('Games bet survives opening the Yardage Book and returning',async({page})=>{
 await page.goto('/playtest/');
 await page.evaluate(()=>{localStorage.setItem('dagger_foursome_active',JSON.stringify({players:['A','B'],format:'skins',stake:5,holes:[[4,5]],started:123}));localStorage.setItem('dagger_bbb_active',JSON.stringify({players:['A','B'],holes:[[0,1,null]],started:123}));});
 await page.reload();
 const before=await page.evaluate(()=>({w:localStorage.getItem('dagger_foursome_active'),b:localStorage.getItem('dagger_bbb_active')}));
 await test.step('dismiss opening Starter Desk and complete starter setup',async()=>{const desk=page.locator('#dcc-starter-dialog');if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());}await page.locator('#useAustin').click({timeout:5000})});
 await test.step('open Games',async()=>{await page.locator('#tab-games').click({timeout:5000})});
 await test.step('show Yardage Book link',async()=>{await expect(page.locator('#dccGamesYardageAccessLink a')).toBeVisible({timeout:5000})});
 await test.step('open Yardage Book',async()=>{await page.locator('#dccGamesYardageAccessLink a').click({timeout:5000})});
 await expect(page.locator('#position')).toContainText('HOLE 1 / 18');
 await page.locator('#next').click();
 await expect(page.locator('#position')).toContainText('HOLE 2 / 18');
 await page.locator('#return').click();
 await expect(page).toHaveURL(/\/playtest\/?$/);
 await expect(page.locator('#tab-games')).toHaveClass(/active/);
 const after=await page.evaluate(()=>({w:localStorage.getItem('dagger_foursome_active'),b:localStorage.getItem('dagger_bbb_active')}));
 expect(after).toEqual(before);
});
test('Games has direct Yardage Book entry and stable Ghost and 19th Hole links',async({page})=>{
 await page.goto('/playtest/');
 await expect(page.locator('#dccGamesYardageAccessLink a')).toHaveAttribute('href',/yardage-preview\.html/);
 await expect(page.locator('a[href="ghost-preview.html"]').first()).toHaveCount(1);
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
 await expect(page.locator('[data-tab="play"]').first()).toBeVisible();
 await page.screenshot({path:'candidate-screenshots/01-play-iphone.png',animations:'disabled'});
 await page.locator('#tab-games').click();
 await expect(page.locator('#dccGamesYardageAccessLink a')).toBeVisible();
 await page.screenshot({path:'candidate-screenshots/02-games-iphone.png',animations:'disabled'});
 await page.locator('#tab-bets').click();
 await expect(page.locator('[data-tab="bets"]').first()).toBeVisible();
 await page.screenshot({path:'candidate-screenshots/03-ledger-iphone.png',animations:'disabled'});
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
 await expect(home.locator('a[href="ghost-preview.html"]')).toHaveCount(1);
 await home.locator('[data-dcc-go="games"]').click();
 await expect(page.locator('#gamesMenu')).toBeVisible();
 await page.locator('#tab-play').click();
 await home.locator('[data-dcc-go="ledger"]').click();
 await expect(page.locator('#moneyRoomSection')).toBeVisible();
 await page.locator('#tab-play').click();
 await expect(home).toBeVisible();
 await page.screenshot({path:'candidate-screenshots/04-clubhouse-new-iphone.png',animations:'disabled'});
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

test('Clubhouse preserves original tab names and opens the existing Money Room setup',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#useAustin').click({timeout:5000});
 await expect(page.locator('#tab-play .dcc-tab-title')).toHaveText('The Caddy');
 await expect(page.locator('#tab-games .dcc-tab-title')).toHaveText('The Grounds');
 await expect(page.locator('#tab-bets .dcc-tab-title')).toHaveText('The Ledger');
 await expect(page.locator('#tab-settings .dcc-tab-title')).toHaveText('The Clubhouse');
 const home=page.locator('#dccClubhouseHome');
 await expect(home.locator('[data-dcc-go="money"]')).toBeVisible();
 await home.locator('[data-dcc-go="money"]').click();
 await expect(page.locator('#moneyRoomSection')).toBeVisible();
 await expect(page.locator('#roomSetup')).toHaveAttribute('open','');
 await page.locator('#tab-play').click();
 await home.locator('[data-dcc-go="ledger"]').click();
 await expect(page.locator('#tab-bets')).toHaveAttribute('aria-current','page');
 await page.locator('#tab-play').click();
 await expect(home.locator('img.dcc-home-seal')).toHaveAttribute('src','dcc-approved-seal.png');
});

test('Three on-course tabs retain both Club Services with a safe return',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible())await page.keyboard.press('Escape');
 if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());
 await page.locator('#useAustin').click({timeout:5000});
 for(const tab of ['play','games','bets'])await expect(page.locator('#tab-'+tab)).toBeVisible();
 for(const tab of ['bag','settings'])await expect(page.locator('#tab-'+tab)).toBeHidden();
 const services=page.locator('#dccClubhouseHome .dcc-home-services');
 await services.locator('summary').click();
 await services.locator('[data-dcc-go="bag"]').click();
 await expect(page.locator('#dccReturnFrombag')).toBeVisible();
 await page.locator('#dccReturnFrombag').click();
 await expect(page.locator('#dccClubhouseHome')).toBeVisible();
 await services.locator('[data-dcc-go="settings"]').click();
 await expect(page.locator('#dccReturnFromsettings')).toBeVisible();
 await page.locator('#dccReturnFromsettings').click();
 await expect(page.locator('#dccClubhouseHome')).toBeVisible();
 await page.locator('#tab-games').click();
 await expect(page.locator('#gamesMenu')).toBeVisible();
 await page.locator('#tab-bets').click();
 await expect(page.locator('#moneyRoomSection')).toBeVisible();
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

test('Pencil Yardage Book follows selected caddy without inventing hole geometry',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('dagger_selected_caddie',JSON.stringify('vinny'))});
 await page.goto('/playtest/yardage-preview.html?hole=1');
 await expect(page.locator('.paper')).toBeVisible();
 await expect(page.locator('#caddySignature')).toContainText('Vinny');
 await expect(page.locator('#caddyNote')).not.toBeEmpty();
 await expect(page.locator('.field-sketch')).toContainText('No invented course layout');
 await expect(page.locator('#yards')).toContainText('Not verified');
 await page.locator('#next').click();
 await expect(page.locator('#position')).toContainText('HOLE 2 / 18');
});
