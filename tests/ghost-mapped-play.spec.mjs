import {test,expect,devices} from '@playwright/test';

test.use({...devices['iPhone 13'],serviceWorkers:'block'});
const base = 'http://127.0.0.1:8768';

test('mapped Ghost match survives a reload and records its completed shotgun hole',async({page})=>{
 test.setTimeout(90_000);
 await page.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
 await page.addInitScript(()=>{
  const key='dcc_active_round_course_v1';
  if(localStorage.getItem(key))return;
  localStorage.setItem(key,JSON.stringify({version:1,selectedAt:1,selection:{
   course:{provider:'opengolfapi',providerCourseId:'1c31d1fb-faa1-4d9f-80a2-f281982df126',
    name:'Bayonet at Puppy Creek',region:'NC'},
   tee:{providerTeeId:'white',name:'Regular / White',totalYards:5752},holeNumber:4
  }}));
 });
 await page.goto(base+'/index.html');
 await page.waitForFunction(()=>typeof dccGhostRender==='function');
 await page.evaluate(()=>{
  dccGhostLength=9;
  dccGhostStartHole=4;
  document.getElementById('dccGhostLength').value='9';
  dccGhostRender();
  document.getElementById('dccGhostPlay').click();
 });
 const frame=page.frameLocator('#dccGhostPlayback iframe');
 await expect(frame.locator('#ghostMapStatus')).toContainText('Simulated play on the Yardage Book drawing.');
 const draft=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dcc_house_ghost_draft_v1')));
 const {pending}=await draft();
 expect(pending.hole).toBe(4);
 expect(pending.mappedPlay.shots).toHaveLength(pending.ghost);
 const completion=frame.getByText('Holed out in '+pending.ghost+' strokes',{exact:true});
 await expect(completion).toBeVisible({timeout:30_000});
 await expect(frame.locator('#shots li')).toHaveCount(pending.ghost);
 await expect(frame.locator('#markers circle')).toHaveCount(pending.ghost);
 await page.reload();
 await page.evaluate(()=>document.getElementById('dccGhostPlay').click());
 expect((await draft()).pending).toEqual(pending);
 await expect(completion).toBeVisible({timeout:30_000});
 await page.evaluate(()=>{
  document.getElementById('dccGhostPlayerScore').value='4';
  document.getElementById('dccGhostRecord').click();
 });
 expect((await draft()).holes).toEqual([{holeNumber:4,par:4,player:4,ghost:pending.ghost}]);
 await page.evaluate(()=>document.getElementById('dccGhostPlay').click());
 await expect(frame.locator('#ghostMapStatus')).toContainText('Simulated play on the Yardage Book drawing.');
 expect((await draft()).pending.hole).toBe(5);
});
