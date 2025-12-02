// apps/recorder-worker/src/browser/autoJoinAndRecord2.ts

import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import { startRecording } from '../recorder/startRecording'; // <-- import recorder

async function main() {
  const userDataDir = path.resolve('/Users/asif/Library/Application Support/Google/Chrome/Profile 2');

  const context: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--enable-usermedia-screen-capturing',
      '--auto-select-desktop-capture-source=Google Meet',
      '--no-sandbox',
    ],
  });

  const page: Page = await context.newPage();
  await page.goto('https://meet.google.com/rjb-gmcd-rqg');

  console.log("🔍 Searching for Join buttons...");

  // Try all join button variations Fireflies-style
  const selectors = [
    'button[jsname="Qx7uuf"]',                             // Join now
    'div[role="button"] span:text("Join now")',
    'button:has-text("Join now")',
    'button:has-text("Ask to join")',
    'button[aria-label^="Join"]',
    'text="Ask to join"',
    'text="Join now"',
  ];

  let joined = false;

  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 4000 });
      await page.click(selector);
      console.log(`🚀 Joined using selector → ${selector}`);
      joined = true;
      break;
    } catch {}
  }

  if (!joined) {
    console.log("❌ Could not auto-join — UI might require one manual click.");
    return;
  }

  console.log("🎥 You're now inside the meeting — starting recording...");

  // Start recording with FFmpeg
  const ffmpegProcess = await startRecording('test-meeting');

  // Optional: stop recording after N seconds
  // setTimeout(() => ffmpegProcess.kill('SIGINT'), 1000 * 60 * 30); // 30 min

  // Keep script running so recording continues
  await page.waitForTimeout(1000 * 60 * 60); // 1 hour
}

main().catch(console.error);
