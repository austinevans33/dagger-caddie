import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

const project='dagger-country-club-staging';
const stagingConfig=readFileSync('playtest/firebase-config.js','utf8');
if(!stagingConfig.includes('projectId: "'+project+'"')) throw Error('Explicit staging project required');
const launch='http://127.0.0.1:8766/dagger-caddie/';

test.use({viewport:{width:390,height:844},serviceWorkers:'block',actionTimeout:10000,navigationTimeout:20000});
test('two staging sessions share Shining Rock room scores, corrections and final balances',async ({page,browser})=>{
  test.setTimeout(210000);
  const guestContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const guest=await guestContext.newPage();
  async function prepare(client){
    client.on('dialog',dialog=>dialog.accept());
    await client.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.origin==='http://127.0.0.1:8766'){
        if(url.pathname.endsWith('/firebase-config.js'))return route.fulfill({contentType:'text/javascript',body:stagingConfig});
        return route.continue();
      }
      const text=decodeURIComponent(route.request().url()+' '+(route.request().postData()||''));
      if(text.includes('dagger-caddie-money-room'))return route.abort();
      if(['www.gstatic.com','identitytoolkit.googleapis.com','securetoken.googleapis.com'].includes(url.hostname))return route.continue();
      if(url.hostname==='firestore.googleapis.com'&&text.includes(project))return route.continue();
      return route.abort();
    });
    await client.addInitScript(()=>localStorage.setItem('dagger_setup_complete','true'));
    await client.goto(launch);
    await client.locator('#dcc-starter-query').fill('Shining Rock');
    await client.locator('#dcc-starter-search').click();
    await client.locator('#dcc-starter-results button').filter({hasText:'The Rock'}).click();
    await client.locator('#dcc-starter-tees').selectOption({label:'Gold · 6728 yards'});
    await client.locator('#dcc-starter-checkin').click();
    await client.locator('[data-dcc-go="money"]').click();
    await expect(client.locator('#roomMe')).toBeVisible();
  }
  try{
    await prepare(page);
    await page.locator('#roomMe').fill('QA Rock Host');
    await page.locator('#roomPlayers').fill('QA Rock Guest');
    await page.locator('#roomFormat').selectOption('hole');
    await page.locator('#roomStake').fill('1');
    await page.locator('#roomCreate').click();
    await expect(page.locator('#roomStatus')).toContainText(/LIVE|Could not/, {timeout:45000});
    await expect(page.locator('#roomStatus')).toContainText('LIVE');
    const code=await page.locator('#roomCode').inputValue();
    expect(code).toMatch(/^[a-f0-9]{32}:[a-f0-9]{16}$/);
    await prepare(guest);
    await guest.locator('#roomMe').fill('QA Rock Guest');
    await guest.locator('#roomCode').fill(code);
    await guest.locator('#roomJoin').click();
    await expect(guest.locator('#roomStatus')).toContainText(/LIVE|failed|denied|Could not/i,{timeout:45000});
    await expect(guest.locator('#roomStatus')).toContainText('LIVE');
    await expect(guest.locator('#roomWho')).toContainText('Shining Rock');
    await expect(guest.locator('#roomEditor')).toBeHidden();
    async function saveHole(hole,a,b){
      await page.locator('#roomHole').selectOption(String(hole));
      const inputs=page.locator('#roomScoreRows input');
      await inputs.nth(0).fill(String(a));await inputs.nth(1).fill(String(b));
      await page.locator('#roomSaveHole').click();
      await expect(page.locator('#roomLedgerBody tr').nth(hole-1).locator('td').nth(1)).toHaveText(String(a));
      await expect(page.locator('#roomLedgerBody tr').nth(hole-1).locator('td').nth(2)).toHaveText(String(b));
    }
    await saveHole(1,4,5);
    await expect(guest.locator('#roomStandings')).toContainText('QA Rock Host: +$1.00');
    await saveHole(1,6,5);
    await expect(guest.locator('#roomStandings')).toContainText('QA Rock Host: −$1.00');
    await page.reload();await guest.reload();
    await page.locator('#tab-bets').click();
    await guest.locator('#tab-bets').click();
    await expect(page.locator('#roomStatus')).toContainText('LIVE',{timeout:45000});
    await expect(guest.locator('#roomStatus')).toContainText('LIVE',{timeout:45000});
    await expect(guest.locator('#roomStandings')).toContainText('QA Rock Host: −$1.00');
    for(let hole=2;hole<=18;hole++) await saveHole(hole,4,4);
    await expect(guest.locator('#roomStandings')).toContainText('18 holes scored');
    await page.locator('#roomFinish').click();
    await expect(page.locator('#roomFinalStatus')).toHaveText('OFFICIAL FINAL RESULT');
    await expect(guest.locator('#roomFinalStatus')).toHaveText('OFFICIAL FINAL RESULT');
    await expect(guest.locator('#roomFinalPayouts')).toContainText('QA Rock Host−$1.00');
    await expect(guest.locator('#roomFinalPayouts')).toContainText('QA Rock Guest+$1.00');
    for(const client of [page,guest]){
      await client.reload();
      const archives=await client.evaluate(()=>JSON.parse(localStorage.getItem('dagger_room_archives')||'[]'));
      expect(archives.filter(record=>record.roomId===code.split(':')[0])).toHaveLength(1);
      const record=archives.find(record=>record.roomId===code.split(':')[0]);
      expect(record.payouts).toEqual([-1,1]);
      expect(record.round.selection.course.providerCourseId).toBe('shining-rock-northbridge-ma');
      expect(record.roundIdentity).toBe(record.round.selection.course.providerCourseId+'|gold|'+record.round.selectedAt);
      expect(record).not.toHaveProperty('paid');
    }
  }finally{await guestContext.close();}
});
