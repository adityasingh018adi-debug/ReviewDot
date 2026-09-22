import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1440, height: 900 },
    // sandboxed environments provide a pre-installed browser via this env var
    launchOptions: process.env.PW_EXECUTABLE_PATH
      ? { executablePath: process.env.PW_EXECUTABLE_PATH, args: ['--no-sandbox'] }
      : {},
  },
  webServer: {
    /*
     * NEXT_PUBLIC_* is inlined at build time, so demo mode has to be set for the
     * build as well as the server — setting it only on `next start` leaves the
     * bundle thinking nothing is configured, and the dashboard correctly refuses
     * to render. That refusal is the behaviour under test in `app-mode`.
     */
    command:
      'NEXT_PUBLIC_DEMO_MODE=1 npm run build && NEXT_PUBLIC_DEMO_MODE=1 npx next start --port 4173',
    env: { NEXT_PUBLIC_DEMO_MODE: '1' },
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
