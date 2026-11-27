const {test,expect}=require('@playwright/test');
test('Word Bloom grows a garden, retains legacy duration records and stops on navigation',async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('keysprout-arcade-best','7');localStorage.setItem('keysprout-arcade-best-15','2');localStorage.setItem('keysprout-arcade-best-60','11');});
  await page.clock.install();await page.goto('/');await page.locator('#arcTab').click();
  await expect(page.locator('#arcBest')).toContainText('7 words');await page.locator('#arcDuration').selectOption('60');await expect(page.locator('#arcBest')).toContainText('11 words');
  await page.locator('#arcDuration').selectOption('15');await page.locator('#arcStart').click();
  for(let i=0;i<4;i++)await page.locator('#arcInput').fill(await page.locator('#arcWord').innerText());
  await expect(page.locator('#garden svg')).toHaveCount(4);await expect(page.locator('#arcScore')).toHaveText('4 words');
  await page.clock.fastForward(15000);await expect(page.locator('#arcResult')).toContainText('4 flowers grown');await expect(page.locator('#arcBest')).toContainText('4 words');
  await page.locator('#arcStart').click();await page.locator('#arcInput').fill(await page.locator('#arcWord').innerText());await page.locator('#homeTab').click();await page.clock.fastForward(20000);
  expect(await page.evaluate(()=>arcTick)).toBe(0);expect(await page.evaluate(()=>KS.data.arcade['bloom-15'])).toBe(4);
  await page.reload();await page.locator('#arcTab').click();await page.locator('#arcDuration').selectOption('15');await expect(page.locator('#arcBest')).toContainText('4 words');
});
test('Word Relay scores combos, increases difficulty and has separate saved best',async({page})=>{
  await page.clock.install();await page.goto('/');await page.locator('#arcTab').click();await page.locator('#relayGame').click();await page.locator('#arcDuration').selectOption('15');await page.locator('#arcStart').click();
  for(let i=0;i<5;i++)await page.locator('#arcInput').fill(await page.locator('#arcWord').innerText());
  await expect(page.locator('#arcRound')).toContainText('Round 2');await expect(page.locator('#arcScore')).toHaveText('80 points');
  const next=await page.locator('#arcWord').innerText();expect(next.length).toBeGreaterThanOrEqual(5);
  await page.locator('#arcInput').fill('zzzz');await expect(page.locator('#arcCombo')).toHaveText('Combo 0');await expect(page.locator('#arcInput')).toHaveAttribute('aria-invalid','true');
  await page.locator('#arcInput').fill(next);await expect(page.locator('#arcScore')).toHaveText('90 points');await page.clock.fastForward(15000);
  await expect(page.locator('#arcResult')).toContainText('90 points');await expect(page.locator('#arcBest')).toContainText('90 pts');
  await page.locator('#bloomGame').click();await expect(page.locator('#arcBest')).toContainText('0 words');
  await page.locator('#relayGame').click();await page.locator('#arcStart').click();await page.locator('#bloomGame').click();expect(await page.evaluate(()=>arcTick)).toBe(0);
});
test('Progress filters, trends, records, mistake drill, settings and CSV',async({page})=>{
  await page.clock.install({time:new Date('2026-11-27T10:00:00')});
  await page.addInitScript(()=>!localStorage.getItem('keysprout-academy-v2')&&localStorage.setItem('keysprout-academy-v2',JSON.stringify({version:2,lessons:{'index-fingers':{stars:3,bestAccuracy:100}},activeDays:['2026-11-26','2026-11-27'],settings:{goal:5},mistakes:{f:3,j:2},rounds:[{date:'2026-11-27',mode:'practice',textMode:'code',duration:60,score:48,percent:98,errors:2,mistakes:{';':2}},{date:'2026-11-25',mode:'daily',textMode:'everyday',duration:60,score:40,percent:100,errors:0},{date:'2026-09-01',mode:'practice',textMode:'code',duration:30,score:32,percent:91,errors:4}]})));
  await page.goto('/');await expect(page.locator('#homeStreak')).toHaveText('3 days');await expect(page.locator('#homeGoal')).toHaveText('1 / 5');await page.locator('#progressTab').click();
  await expect(page.locator('#dashCount')).toHaveText('3');await expect(page.locator('#speedTrend svg')).toHaveCount(1);await expect(page.locator('#accuracyTrend svg')).toHaveCount(1);
  await page.locator('#dateFilter').selectOption('7');await expect(page.locator('#dashCount')).toHaveText('2');await page.locator('#modeFilter').selectOption('code');await expect(page.locator('#dashCount')).toHaveText('1');
  await expect(page.locator('#mistakeBreakdown')).toContainText('; · 2 misses');
  const downloadPromise=page.waitForEvent('download');await page.locator('#exportCsv').click();const download=await downloadPromise;const fs=require('fs');const csv=fs.readFileSync(await download.path(),'utf8');expect(csv).toContain('"Code","60","48","98","2"');expect(csv).not.toContain('2026-09-01');
  await page.locator('#progressDrill').click();await expect(page.locator('#drillTitle')).toHaveText('Your tricky keys');
  await page.locator('#progressTab').click();await page.locator('#goalTarget').selectOption('10');await page.locator('#settingTheme').selectOption('dark');await page.locator('#settingSound').check();await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('#homeGoal')).toHaveText('1 / 10');await page.locator('#learnTab').click();await expect(page.locator('#soundToggle')).toHaveText('Sound on');
});
