const { test, expect } = require("@playwright/test");
test("home navigation, fresh state, theme persistence and layout", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("#homeBest")).toHaveText("—");
  await expect(page.locator("#homeStreak")).toHaveText("0 days");
  await expect(page.locator(".hero-photo")).toHaveJSProperty(
    "naturalWidth",
    800,
  );
  await page.locator("#continueLearning").click();
  await expect(page.locator("#learnPanel")).toBeVisible();
  await page.locator("#homeTab").click();
  await page.locator("#homeDaily").click();
  await expect(page.locator("#daily")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#themeToggle").click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
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
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
