import {test,expect} from '@playwright/test';
test('Games bet survives opening the Yardage Book and returning',async({page})=>{
 await page.goto('/playtest/');
 await page.evaluate(()=>{localStorage.setItem('dagger_foursome_active',JSON.stringify({players:['A','B'],format:'skins',stake:5,holes:[[4,5]],started:123}));localStorage.setItem('dagger_bbb_active',JSON.stringify({players:['A','B'],holes:[[0,1,null]],started:123}));});
 await page.reload();
 const before=await page.evaluate(()=>({w:localStorage.getItem('dagger_foursome_active'),b:localStorage.getItem('dagger_bbb_active')}));
 await page.locator('#useAustin').click();
 await page.locator('#tab-games').click();
 await expect(page.locator('#dccGamesYardageAccessLink a')).toBeVisible();
 await page.locator('#dccGamesYardageAccessLink a').click();
 await expect(page.locator('#position')).toContainText('HOLE 1 / 18');
 await page.locator('#next').click();
 await expect(page.locator('#position')).toContainText('HOLE 2 / 18');
 await page.locator('#return').click();
 await expect(page).toHaveURL(/\/playtest\/?$/);
 const after=await page.evaluate(()=>({w:localStorage.getItem('dagger_foursome_active'),b:localStorage.getItem('dagger_bbb_active')}));
 expect(after).toEqual(before);
});
test('Games has direct Yardage Book entry and stable Ghost and 19th Hole links',async({page})=>{
 await page.goto('/playtest/');
 await expect(page.locator('#dccGamesYardageAccessLink a')).toHaveAttribute('href',/yardage-preview\.html/);
 await expect(page.locator('a[href="ghost-preview.html"]').first()).toHaveCount(1);
 await expect(page.locator('a[href="19th-hole.html"]').first()).toHaveCount(1);
});
