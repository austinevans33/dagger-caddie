import {test,expect} from '@playwright/test';
test('Grounds previews paper strokes against Nassau without touching saved game',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'test-course',name:'Test Course',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1}}));
  localStorage.setItem('dcc_solo_scorecard_v1',JSON.stringify({version:1,identity:'test-course|blue|123456',hole:2,length:18,scores:[4,...Array(17).fill(null)]}));
  localStorage.setItem('dagger_foursome_active',JSON.stringify({format:'nassau',players:['Golfer','Friend'],roundIdentity:'test-course|blue|123456',stake:10,holes:[[5,4]],started:123}));
 });
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());}
 await page.locator('#useAustin').click({timeout:5000});
 const before=await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'));
 await page.locator('#tab-games').click();
 // This reconciliation utility is deliberately hidden from the simplified
 // Grounds UI; expose it only in QA to preserve regression coverage.
 await page.addStyleTag({content:'#dccScorePulse{display:block!important}'});

 const preview=page.locator('#dccGameScorePreview');await preview.locator('summary').click();
 await page.locator('#dccGameScorePlayer').selectOption('0');
 await page.locator('#dccGameScoreCompare').click();
 await expect(page.locator('#dccGameScoreCompareResult')).toContainText('1/18 paper scores');
 await expect(page.locator('#dccGameScoreCompareResult')).toContainText('1 hole(s) differ');
 await expect(page.locator('#dccGameScoreCompareResult')).toContainText('game and Ledger unchanged');
 expect(await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'))).toBe(before);
 await page.evaluate(()=>{
  const card=JSON.parse(localStorage.getItem('dcc_solo_scorecard_v1'));card.scores[0]=3;localStorage.setItem('dcc_solo_scorecard_v1',JSON.stringify(card));
 });
 await page.locator('#dccGameScoreCompare').click();
 await expect(page.locator('#dccGameScoreCompareResult')).toContainText('1 hole(s) differ');
 expect(await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'))).toBe(before);
});
test('Grounds refuses preview when active wager belongs to another course round',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'test-course',name:'Test Course',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1}}));
  localStorage.setItem('dcc_solo_scorecard_v1',JSON.stringify({version:1,identity:'test-course|blue|123456',hole:1,length:18,scores:Array(18).fill(null)}));
  localStorage.setItem('dagger_foursome_active',JSON.stringify({format:'skins',players:['A','B'],stake:5,roundIdentity:'different|tee|123',holes:[[4,5]]}));
 });
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());}
 await page.locator('#useAustin').click({timeout:5000});
 await page.locator('#tab-games').click();
 // This reconciliation utility is deliberately hidden from the simplified
 // Grounds UI; expose it only in QA to preserve regression coverage.
 await page.addStyleTag({content:'#dccScorePulse{display:block!important}'});

 await page.locator('#dccGameScorePreview summary').click();
 await page.locator('#dccGameScorePlayer').selectOption('0');
 await page.locator('#dccGameScoreCompare').click();
 await expect(page.locator('#dccGameScoreCompareResult')).toContainText('different round');
});

test('Grounds safely explains an older unbound game without touching wager history',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('dcc_active_round_course_v1',JSON.stringify({version:1,selectedAt:123456,selection:{course:{provider:'opengolfapi',providerCourseId:'test-course',name:'Test Course',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1}}));
  localStorage.setItem('dcc_solo_scorecard_v1',JSON.stringify({version:1,identity:'test-course|blue|123456',hole:2,length:18,scores:[4,...Array(17).fill(null)]}));
  localStorage.setItem('dagger_foursome_active',JSON.stringify({format:'skins',players:['Golfer','Friend'],stake:5,holes:[[5,4]],started:123}));
 });
 await page.goto('/playtest/');
 const desk=page.locator('#dcc-starter-dialog');
 if(await desk.isVisible()){await page.keyboard.press('Escape');if(await desk.isVisible())await page.evaluate(()=>document.querySelector('#dcc-starter-dialog')?.close());}
 await page.locator('#useAustin').click({timeout:5000});
 const before=await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'));
 await page.locator('#tab-games').click();
 // This reconciliation utility is deliberately hidden from the simplified
 // Grounds UI; expose it only in QA to preserve regression coverage.
 await page.addStyleTag({content:'#dccScorePulse{display:block!important}'});

 await page.locator('#dccGameScorePreview summary').click();
 await page.locator('#dccGameScorePlayer').selectOption('0');
 await page.locator('#dccGameScoreCompare').click();
 await expect(page.locator('#dccGameScoreCompareResult')).toContainText('older game is not linked to a course round');
 expect(await page.evaluate(()=>localStorage.getItem('dagger_foursome_active'))).toBe(before);
});
