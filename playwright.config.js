const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 30000,
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    channel:
      process.env.PLAYWRIGHT_CHANNEL === "chromium"
        ? undefined
        : process.env.PLAYWRIGHT_CHANNEL || "msedge",
  },
  webServer: {
    command: "node scripts/serve.cjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "ignore",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "phone",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
