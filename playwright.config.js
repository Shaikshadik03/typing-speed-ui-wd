const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', timeout: 30000, fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', channel: 'msedge' },
  webServer: { command: 'python -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } }, { name: 'phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }]
});
