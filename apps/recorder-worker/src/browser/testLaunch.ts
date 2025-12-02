import { chromium } from 'playwright';

async function main() {
  const userDataDir = '/Users/asif/auralis-profile';

const browser = await chromium.launchPersistentContext('/Users/asif/auralis-profile', {
  headless: false,
  channel: 'chrome',
  args: [
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--start-maximized',
  ],
});



  const page = await browser.newPage();
  await page.goto('https://accounts.google.com/');
}

main();
