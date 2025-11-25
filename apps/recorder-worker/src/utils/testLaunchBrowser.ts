import { launchPersistentBrowser } from '../browser/launchBrowser';

async function testLaunchBrowser() {
  try {
    const context = await launchPersistentBrowser();
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto('https://example.com');
    console.log('Success! Browser launched and page opened.');
    await context.close();
  } catch (err) {
    console.error('Error in testLaunchBrowser:', err);
  }
}

testLaunchBrowser();
