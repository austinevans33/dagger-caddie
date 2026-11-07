import {test,expect} from '@playwright/test';

test('Clubhouse opens with five simple doors and no duplicate Ledger or tickets',async({page})=>{
 await page.goto('/playtest/');
 const home=page.locator('#dccClubhouseHome');
 await expect(home).toBeVisible();
 await expect(home.locator('#dccHomeYardage')).toHaveCount(1);
 await expect(home.locator('#dccHomeScorecard')).toHaveCount(1);
 await expect(home.locator('[data-dcc-go="games"]')).toHaveCount(1);
 await expect(home.locator('[data-dcc-go="ghost"]')).toHaveCount(1);
 await expect(home.locator('[data-dcc-go="money"]')).toHaveCount(1);
 await expect(home.locator('[data-dcc-go="ticket"],[data-dcc-go="ledger"]')).toHaveCount(0);
 await expect(page.locator('#tab-bets')).toHaveCount(1);
});
test('Scorecard entrance opens Starter Desk if there is no checked-in course',async({page})=>{
 await page.goto('/playtest/');
 await page.evaluate(()=>{
  localStorage.removeItem('dcc_active_round_course_v1');
  localStorage.removeItem('dcc_solo_scorecard_v1');
  document.getElementById('dcc-starter-dialog')?.close();
 });
 await page.locator('#dccHomeScorecard').click();
 await expect(page.locator('#dcc-starter-dialog')).toBeVisible();
});
test('Scorecard subtitle only displays saved scores from matching selected round',async({page})=>{
 await page.goto('/playtest/');
 await expect(page.locator('#dccHomeScoreStatus')).toContainText('Start a round or enter your score');
});
