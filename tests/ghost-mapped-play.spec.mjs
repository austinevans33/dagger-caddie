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
 const openGhost=async()=>{
  await page.evaluate(()=>switchTab('games'));
  await page.locator('#dccR91SoloPanel > summary').click();
 };
 await openGhost();
 await page.locator('#dccGhostLength').selectOption('9');
 await page.locator('#dccGhostStartHole').selectOption('4');
 const play=page.locator('#dccGhostPlay');
 await play.click();
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
 await openGhost();
 await play.click();
 expect((await draft()).pending).toEqual(pending);
 await expect(completion).toBeVisible({timeout:30_000});
 await page.getByLabel('Your strokes').fill('4');
 await page.getByRole('button',{name:'Record Hole Against Ghost'}).click();
 await expect.poll(async()=>(await draft()).holes).toEqual([{holeNumber:4,par:4,player:4,ghost:pending.ghost}]);
 await play.click();
 await expect(frame.locator('#ghostMapStatus')).toContainText('Simulated play on the Yardage Book drawing.');
 expect((await draft()).pending.hole).toBe(5);
 await page.getByLabel('Your strokes').fill('5');
 await page.getByRole('button',{name:'Record Hole Against Ghost'}).click();
 await expect.poll(async()=>(await draft()).holes.length).toBe(2);
 // Direct recording must also prepare a mapped result before saving.
 await page.evaluate(()=>{
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
   if(key==='dcc_house_ghost_draft_v1'){
    const pending=JSON.parse(value).pending;
    if(pending)sessionStorage.setItem('testPreparedGhost',JSON.stringify(pending));
   }
   return original.call(this,key,value);
  };
 });
 await page.getByLabel('Your strokes').fill('4');
 await page.getByRole('button',{name:'Record Hole Against Ghost'}).click();
 await expect.poll(async()=>(await draft()).holes.length).toBe(3);
 const prepared=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('testPreparedGhost')));
 expect(prepared.hole).toBe(6);
 expect(prepared.mappedPlay.shots).toHaveLength(prepared.ghost);
 expect((await draft()).holes.at(-1)).toMatchObject({holeNumber:6,ghost:prepared.ghost});
});
