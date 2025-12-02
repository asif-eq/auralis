import { chromium } from 'playwright';

async function main() {
  // Replace 'Default' with 'Profile 2' if you want the secondary account
  const userDataDir = '/Users/asif/Library/Application Support/Google/Chrome/Default';

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled', // hide automation
      '--disable-infobars',                             // hide "Chrome is being controlled..."
    ],
  });

  const page = await browser.newPage();
  await page.goto('https://meet.google.com/');
}

main();
