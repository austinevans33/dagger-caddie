import {test,expect,devices} from '@playwright/test';

test.use({...devices['iPhone 13']});
const base='http://127.0.0.1:8769';

test('Cup scorecard advances, resumes and corrects standings on a phone viewport',async({page})=>{
 await page.route(base+'/cup-test',route=>route.fulfill({contentType:'text/html',body:
  '<meta name="viewport" content="width=device-width, initial-scale=1"><script type="module">'+
  'import {mountTripDesk} from "/trip-desk-ui.js"; mountTripDesk();</script>'}));
 await page.goto(base+'/cup-test');
 const button=name=>page.getByRole('button',{name,exact:true});
 const open=()=>button('Golf Trip Desk').click();
 const group=()=>button('Score group 1').click();
 await open();
 await page.getByPlaceholder('Trip name').fill('Cup De Diesel Nips');
 await page.getByPlaceholder('Names separated by commas').fill('Alex, Bailey');
 await button('Create Draft').click();
 await page.getByPlaceholder('New round name').fill('Opening round');
 await button('Add Draft Round').click();
 await button('Start Opening round').click();
 await group();
 const hole=page.getByLabel('Scoring hole');
 const alex=page.getByLabel('Alex',{exact:true});
 const bailey=page.getByLabel('Bailey',{exact:true});
 await expect(alex).toBeFocused();
 async function score(a,b){
  await alex.fill(String(a));
  await bailey.fill(String(b));
  await button('Save hole').click();
 }
 await score(4,5);
 await expect(hole).toHaveValue('1');
 await expect(page.getByText('Alex · 1 skins · 1 holes scored',{exact:true})).toBeVisible();
 await page.reload();
 await open();
 await group();
 await expect(hole).toHaveValue('1');
 await hole.selectOption('0');
 await expect(alex).toHaveValue('4');
 await score(5,4);
 await expect(page.getByText('Bailey · 1 skins · 1 holes scored',{exact:true})).toBeVisible();
 await score(3,4);
 await expect(hole).toHaveValue('2');
 await expect(page.getByText('Alex · 1 skins · 2 holes scored',{exact:true})).toBeVisible();
 await expect(page.getByText('Bailey · 1 skins · 2 holes scored',{exact:true})).toBeVisible();
});
