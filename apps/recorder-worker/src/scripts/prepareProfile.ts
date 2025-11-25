// prepareProfile.ts
import path from 'path'
import fs from 'fs'
import { chromium } from 'playwright'

async function main() {
  const profile = path.resolve(process.cwd(), '.chrome-profile')
  if (!fs.existsSync(profile)) fs.mkdirSync(profile, { recursive: true })

  console.log('Launching Chrome for one-time manual login...')
  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    // use Playwright's chromium; if you prefer system Chrome, set executablePath
    args: [
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800'
    ]
  })

  const page = await context.newPage()
  console.log('Go to https://accounts.google.com and sign in with the account the recorder will use.')
  console.log('When you are done logging in and have allowed microphone/camera, close the browser window to finish.')

  // keep the process alive until manual close
  await context.waitForEvent('close',{ timeout: 5 * 60 * 1000 })
  console.log('Profile prepared.')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
