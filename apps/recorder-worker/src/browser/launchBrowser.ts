import { chromium } from 'playwright'

export async function launchBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream']
  })

  const context = await browser.newContext({
    permissions: ['microphone', 'camera'],
    viewport: { width: 1280, height: 720 }
  })

  return { browser, context }
}
