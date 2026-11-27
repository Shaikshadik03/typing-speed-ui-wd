const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
test("accessible light and dark views and no runtime errors", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await page.locator("#themeToggle").click();
    for (const tab of [
      "homeTab",
      "learnTab",
      "testTab",
      "arcTab",
      "progressTab",
    ]) {
      await page.locator("#" + tab).click();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        theme + " " + tab,
      ).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});
test("all lessons complete in sequence, physical typing, reduced motion and narrow layout", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#learnTab").click();
  await page.locator("#activate").click();
  await page.locator("#lessonInput").pressSequentially("fff jjj fj fj");
  await expect(page.locator("#drillStage")).toContainText("Word practice");
  await page.locator("#redo").click();
  for (let l = 0; l < 10; l++) {
    await page.locator("#activate").click();
    for (let stage = 0; stage < 3; stage++)
      await page
        .locator("#lessonInput")
        .fill(
          (await page.locator("#tiles").innerText())
            .replace(/\n/g, "")
            .replace(/␣/g, " "),
        );
    await expect(page.locator("#lessonResult")).toContainText("3 / 3 stars");
    if (l < 9) await page.locator("#advance").click();
  }
  await expect(page.locator("#lessonSummary")).toHaveText(
    "10 of 10 lessons complete",
  );
  await expect(page.locator("#xp")).toHaveText("600 total XP");
  await page.locator("#homeTab").click();
  await expect(page.locator("#continueLearning")).toHaveText(
    "Review your lessons",
  );
  await page.setViewportSize({ width: 320, height: 720 });
  for (const id of [
    "homeTab",
    "learnTab",
    "testTab",
    "arcTab",
    "progressTab",
  ]) {
    await page.locator("#" + id).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      id,
    ).toBeTruthy();
  }
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBeTruthy();
});
test("unavailable storage and malformed legacy data do not prevent practice", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem("keysprout-lessons-v1", "broken");
    localStorage.setItem(
      "keysprout-progress-v1",
      '{"rounds":[null,7,{"score":"bad"}]}',
    );
    Storage.prototype.setItem = function () {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await expect(page.locator("#storageNotice")).toBeVisible();
  await page.locator("#continueLearning").click();
  await page.locator("#activate").click();
  await page.locator("#lessonInput").fill("f");
  await expect(page.locator("#lessonFeedback")).toContainText("Correct");
  expect(errors).toEqual([]);
});
