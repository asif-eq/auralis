import { chromium } from 'playwright'
import path from 'path'

async function main() {
  // const userDataDir = path.resolve('/Users/asif/create/huzzle-workspace/auralis/misc/profiles/AuralisBot')
  const userDataDir = path.resolve('/Users/asif/Library/Application Support/Google/Chrome')
  // const userDataDir = path.resolve('/Users/asif/Library/Application Support/Google/Chrome/Profile 4')
  // const userDataDir = path.resolve('/Users/asif/create/huzzle-workspace/auralis/misc/profiles/Bot2')


  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: false,
    // args: ['--profile-directory=Profile 4'],
    ignoreDefaultArgs: ['--use-mock-keychain']
  })

  const page = await context.newPage()

  // Open Google login
  await page.goto('https://google.com')

}

main()