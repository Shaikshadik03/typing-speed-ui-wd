const {test,expect}=require('@playwright/test');
async function complete(page, mistakes=0) {
  await page.locator('#activate').click();
  for(let i=0;i<mistakes;i++) await page.locator('#lessonInput').fill('x');
  for(let i=0;i<3;i++){
    const phrase=await page.locator('#tiles').innerText();
    await page.locator('#lessonInput').fill(phrase.replace(/\n/g,'').replace(/␣/g,' '));
  }
}
test('lesson completion, unlock, mistake drill and persistent best awards',async({page})=>{
  await page.goto('/');await page.locator('#continueLearning').click();
  await expect(page.getByRole('button',{name:'Home row Locked',exact:false})).toBeDisabled();
  await complete(page,5);
  await expect(page.locator('#lessonResult')).toContainText('Lesson complete');
  await expect(page.locator('#mistakeDrill')).toBeVisible();
  const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('keysprout-academy-v2')).lessons['index-fingers']);
  await page.locator('#mistakeDrill').click();
  await expect(page.locator('#drillTitle')).toHaveText('Your tricky keys');
  await complete(page);
  await expect(page.locator('#lessonResult')).toContainText('Targeted practice complete');
  await page.locator('#lessonChoices').getByRole('button',{name:'Index fingers',exact:false}).click();
  await complete(page);
  await expect(page.locator('#lessonResult')).toContainText('3 / 3 stars');
  await complete(page,35);
  await expect(page.locator('#lessonResult')).toContainText('Best award: 3 / 3 stars');
  await page.reload();
  const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('keysprout-academy-v2')));
  expect(data.lessons['index-fingers'].stars).toBe(3);expect(data.activeDays).toHaveLength(1);expect(first.stars).toBeGreaterThan(0);
  await page.locator('#continueLearning').click();await expect(page.locator('#drillTitle')).toHaveText('Home row');
});
test('legacy migration preserves nonsequential completions and awards',async({page})=>{
  await page.addInitScript(()=>{if(!localStorage.getItem('seeded')){localStorage.setItem('keysprout-lessons-v1',JSON.stringify({'0':{accuracy:80,bestAccuracy:98,wpm:32},'4':{accuracy:90,bestAccuracy:90,wpm:42}}));localStorage.setItem('seeded','1');}});
  await page.goto('/');await page.locator('#learnTab').click();
  await expect(page.locator('#lessonSummary')).toHaveText('2 of 10 lessons complete');
  await expect(page.getByRole('button',{name:'Everyday words Completed',exact:false})).toBeEnabled();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('keysprout-academy-v2')));
  expect(saved.lessons['index-fingers'].stars).toBe(3);expect(saved.legacy.lessons['4'].wpm).toBe(42);
});
test('uppercase and shifted punctuation have opposite Shift guidance and tappable keys',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('keysprout-lessons-v1',JSON.stringify({'4':{accuracy:100}})));
  await page.goto('/');await page.locator('#learnTab').click();
  await page.evaluate(()=>{for(const l of lessons)records[l.id]={stars:3};resetLesson(6);});
  await page.locator('#activate').click();
  await expect(page.locator('#finger')).toContainText('Left index finger + hold Right Shift');
  await page.getByRole('button',{name:'Right Shift',exact:true}).click();
  await page.getByRole('button',{name:'f · Left index finger',exact:true}).click();
  await expect(page.locator('#lessonFeedback')).toContainText('Correct');
  const hints=await page.evaluate(()=>['!','@',':','{','?','"','|'].map(keyHint));
  expect(hints.map(x=>x.base)).toEqual(['1','2',';','[','/','\'','\\']);
  expect(hints.every(x=>x.shifted)).toBeTruthy();
});
