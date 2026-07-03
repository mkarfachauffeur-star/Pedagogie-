import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://www.pedagogia-drive.fr'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'scripts/output/playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-13', use: { ...devices['iPhone 13'] } },
    { name: 'iphone-se', use: { ...devices['iPhone SE'] } },
    { name: 'ipad', use: { ...devices['iPad Pro 11'] } },
  ],
})
