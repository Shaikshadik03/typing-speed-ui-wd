const { test, expect } = require("@playwright/test");
test("timed scoring, comparable results, mistakes, no input and cancellation", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.locator("#homeTest").click();
  await page.locator("#duration").selectOption("15");
  await page.locator("#start").click();
  const text = await page.locator("#passage").innerText();
  await page.locator("#typing").fill(text.slice(0, 24) + "~");
  await page.clock.fastForward(15000);
  await expect(page.locator("#testResult")).toContainText("19 WPM");
  await expect(page.locator("#testResult")).toContainText(
    "96% accuracy · 1 errors",
  );
  await expect(page.locator("#testResult")).toContainText("new baseline");
  await page.locator("#testMistakeDrill").click();
  await expect(page.locator("#drillTitle")).toHaveText("Your tricky keys");
  await page.locator("#testTab").click();
  await expect(page.locator("#testResult")).toBeVisible();
  await page.locator("#start").click();
  await page
    .locator("#typing")
    .fill((await page.locator("#passage").innerText()).slice(0, 30));
  await page.clock.fastForward(15000);
  await expect(page.locator("#testResult")).toContainText("+5 WPM");
  await page.locator("#duration").selectOption("30");
  await page.locator("#start").click();
  await page.locator("#typing").fill("a");
  await page.clock.fastForward(30000);
  await expect(page.locator("#testResult")).toContainText("new baseline");
  await page.locator("#start").click();
  await page.clock.fastForward(30000);
  await expect(page.locator("#testResult")).toContainText("Nothing was saved");
  const count = await page.evaluate(() => KS.data.rounds.length);
  expect(count).toBe(3);
  await page.locator("#start").click();
  await page.locator("#typing").fill("abc");
  await page.locator("#homeTab").click();
  await page.clock.fastForward(40000);
  expect(await page.evaluate(() => KS.data.rounds.length)).toBe(3);
  await page.reload();
  expect(await page.evaluate(() => KS.data.rounds.length)).toBe(3);
});
test("every mode has long passages and daily challenge is date deterministic", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.locator("#homeTest").click();
  for (const mode of ["everyday", "symbols", "code"]) {
    await page.locator("#level").selectOption(mode);
    for (const duration of ["15", "30", "60", "120"]) {
      await page.locator("#duration").selectOption(duration);
      expect(await page.evaluate(() => target.length)).toBeGreaterThan(14000);
      await expect(page.locator("#time")).toHaveText(duration + "s");
    }
  }
  await page.locator("#daily").click();
  const first = await page.locator("#passage").innerText();
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto("http://127.0.0.1:4173");
  await other.locator("#homeDaily").click();
  expect(await other.locator("#passage").innerText()).toBe(first);
  await context.close();
  await expect(page.locator("#time")).toHaveText("60s");
  await expect(page.locator("#level")).toBeDisabled();
});
test("legacy tests retain scores but unknown duration is not used as a comparison", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "keysprout-progress-v1",
      JSON.stringify({
        rounds: [
          {
            date: "2026-11-26",
            mode: "practice",
            level: "Easy",
            score: 44,
            percent: 98,
          },
        ],
        achievements: { medium: true },
      }),
    ),
  );
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator("#homeBest")).toHaveText("44");
  await page.locator("#homeTest").click();
  await page.locator("#start").click();
  await page.locator("#typing").fill("abc");
  await page.clock.fastForward(30000);
  await expect(page.locator("#testResult")).toContainText("new baseline");
  expect(
    await page.evaluate(() => KS.data.legacy.progress.achievements.medium),
  ).toBeTruthy();
  expect(await page.evaluate(() => KS.data.rounds[1].duration)).toBeNull();
});
