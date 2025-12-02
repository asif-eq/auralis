import { chromium, Page } from 'playwright';

async function main() {
  // Path to your Chrome profile (use Default or Profile 2)
  const userDataDir = '/Users/asif/Library/Application Support/Google/Chrome/Profile 2';

  // Launch Chrome with persistent profile
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled', // hides automation
      '--disable-infobars', // removes the "Chrome is controlled by automated software" banner
    ],
  });

  const page: Page = await context.newPage();

  // Replace with your actual Google Meet URL
  // const meetingUrl = 'https://meet.google.com/your-meeting-code';
  const meetingUrl = 'https://meet.google.com/rjb-gmcd-rqg';
 
  await page.goto(meetingUrl);

  // Wait for the 'Join now' button and click it
  try {
    await page.waitForSelector('button[jsname="Qx7uuf"]', { timeout: 15000 });
    await page.click('button[jsname="Qx7uuf"]');
    console.log('Clicked Join now!');
  } catch {
    console.log('Join button not found — maybe already in meeting or manual prompt required.');
  }

  // Optional: close context after some time
  // await context.close();
}

main().catch(console.error);
