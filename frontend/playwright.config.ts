import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3001',
    browserName: 'chromium',
    permissions: ['camera', 'microphone', 'clipboard-read', 'clipboard-write'],
    launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    { command: `"${process.env.E2E_PYTHON ?? (process.platform === 'win32' ? '../backend/venv/Scripts/python.exe' : '../backend/venv/bin/python')}" ../backend/tests/run_e2e_server.py`, url: 'http://localhost:8001/health', timeout: 60_000, reuseExistingServer: false },
    { command: 'npx next dev --port 3001', url: 'http://localhost:3001', timeout: 120_000, reuseExistingServer: false, env: { NEXT_PUBLIC_API_URL: 'http://localhost:8001', NEXT_DIST_DIR: '.next-e2e' } },
  ],
})
