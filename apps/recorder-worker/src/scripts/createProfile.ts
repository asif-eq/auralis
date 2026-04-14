import { chromium } from 'playwright'
import path from 'path'

async function createProfile() {
  const userDataDir = path.resolve(
    '/Users/asif/create/huzzle-workspace/auralis/misc/profiles/AuralisBotV2'
  )

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',   // important: use real Chrome
    headless: false
  })

  const page = await context.newPage()

  console.log('\nLogin manually in the opened browser.\n')

  await page.goto('https://accounts.google.com')

  // keep browser open so you can log in
  await new Promise(() => {})
}

createProfile()