import {test,expect,devices} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {sharedTripStore} from '../trip-shared.js';

test.use({...devices['iPhone 13']});
const origin='http://127.0.0.1:8769';

test('host and assigned scorekeeper share the Cup across browser sessions',async({browser})=>{
 test.skip(!process.env.FIRESTORE_EMULATOR_HOST,'Requires the isolated Firestore emulator');
 test.setTimeout(60000);
 const {initializeTestEnvironment}=await import('@firebase/rules-unit-testing');
 const sdk=await import('firebase/firestore');
 const env=await initializeTestEnvironment({projectId:'demo-dcc-trip',firestore:{
  rules:await readFile(new URL('../firestore.trip-emulator.rules',import.meta.url),'utf8')
 }});
 await env.clearFirestore();
 const contexts=[], stops=[];
 async function phone(uid){
  const context=await browser.newContext({...devices['iPhone 13']});
  contexts.push(context);
  const page=await context.newPage();
  const store=sharedTripStore(env.authenticatedContext(uid).firestore(),sdk);
  await page.exposeFunction('cupRequest',(method,args)=>store[method](...args));
  await page.exposeFunction('cupObserve',(tripId,draft)=>{
   const stop=store.watch(tripId,draft,state=>{
    void page.evaluate(state=>window.receiveCup?.(state),state).catch(()=>{});
   },()=>{});
   stops.push(stop);
  });
  await page.route(origin+'/shared-cup-test',route=>route.fulfill({contentType:'text/html',body:`
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <script type="module">
    import {mountTripDesk} from '/trip-desk-ui.js';
    const store=Object.fromEntries(['publish','grant','load','assignedGroups','save'].map(
     method=>[method,(...args)=>window.cupRequest(method,args)]));
    store.watch=(id,draft,update)=>{
     window.receiveCup=update;
     void window.cupObserve(id,draft);
     return ()=>{window.receiveCup=null};
    };
    mountTripDesk({shared:{uid:${JSON.stringify(uid)},store}});
   </script>`}));
  await page.goto(origin+'/shared-cup-test');
  await page.getByRole('button',{name:'Golf Trip Desk',exact:true}).click();
  return page;
 }
 try {
  const host=await phone('host');
  const keeper=await phone('keeper');
  const button=(page,name)=>page.getByRole('button',{name,exact:true});
  await host.getByPlaceholder('Trip name').fill('Cup De Diesel Nips');
  await host.getByPlaceholder('Names separated by commas').fill('Alex, Bailey');
  await button(host,'Create Draft').click();
  await host.getByPlaceholder('New round name').fill('Opening round');
  await button(host,'Add Draft Round').click();
  await button(host,'Start Opening round').click();
  await host.getByPlaceholder('Group scorekeeper account ID (optional)').fill('keeper');
  await button(host,'Publish active practice trip').click();
  await expect(host.getByText('Live · Cup De Diesel Nips',{exact:true})).toBeVisible();
  const code=await host.getByPlaceholder('Trip code',{exact:true}).inputValue();
  await keeper.getByPlaceholder('Trip code',{exact:true}).fill(code);
  await button(keeper,'Open shared trip').click();
  await button(keeper,'Opening round · Score group 1').click();
  await expect(button(host,'Opening round · Score group 1')).toHaveCount(0);
  async function score(alex,bailey){
   await keeper.getByLabel('Alex',{exact:true}).fill(String(alex));
   await keeper.getByLabel('Bailey',{exact:true}).fill(String(bailey));
   await button(keeper,'Save hole').click();
  }
  await score(4,5);
  const standings=host.locator('[aria-label="Shared Cup standings"]');
  await expect(standings).toContainText('Alex · 1 skins · 1 holes scored');
  await keeper.reload();
  await button(keeper,'Golf Trip Desk').click();
  await expect(keeper.getByPlaceholder('Trip code',{exact:true})).toHaveValue(code);
  await button(keeper,'Open shared trip').click();
  await button(keeper,'Opening round · Score group 1').click();
  await expect(keeper.getByLabel('Scoring hole')).toHaveValue('1');
  await keeper.getByLabel('Scoring hole').selectOption('0');
  await score(5,4);
  await expect(standings).toContainText('Bailey · 1 skins · 1 holes scored');
 } finally {
  stops.forEach(stop=>stop());
  await Promise.all(contexts.map(context=>context.close()));
  await env.cleanup();
 }
});
