// apps/recorder-worker/src/browser/autoJoinAndRecordv3.ts

import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

// ------------------------------
// FFmpeg recording helper
// ------------------------------
async function startRecording(meetingId: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.resolve('./recordings');
  fs.mkdirSync(outputDir, { recursive: true });
  const output = path.join(outputDir, `${meetingId}_${timestamp}.mkv`);

  console.log(`Recording started -> ${output}`);

  const ffmpeg = spawn(
    'ffmpeg',
    [
      '-f', 'avfoundation',
      '-framerate', '30',
      '-i', '3:1', // screen 0 : BlackHole 2ch
      '-probesize', '100M',
      '-analyzeduration', '100M',
      '-vcodec', 'libx264',
      '-preset', 'fast',
      '-acodec', 'aac',
      '-b:a', '128k',
      output,
    ],
    {
      stdio: 'inherit', // show ffmpeg output
    }
  );

  ffmpeg.on('close', () => {
    console.log(`📁 Recording saved -> ${output}`);
  });

  return ffmpeg;
}

// ------------------------------
// Main auto-join + record
// ------------------------------
async function main() {
  // Dedicated Chrome profile for the bot
  const userDataDir = path.resolve(
    '/Users/asif/Library/Application Support/Google/Chrome/AuralisBot'
  );
  fs.mkdirSync(userDataDir, { recursive: true });

  const context: BrowserContext = await chromium.launchPersistentContext(
    userDataDir,
    {
      headless: false,
      channel: 'chrome',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--use-fake-ui-for-media-stream', // auto-allow mic/cam permissions
        '--no-sandbox',
      ],
    }
  );

  const page: Page = await context.newPage();

  // 🔗 Your Meet link
  await page.goto('https://meet.google.com/qwr-umng-kuy');

  console.log('🔍 Searching for Join buttons...');

  const selectors = [
    'button[jsname="Qx7uuf"]',
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
    } catch {
      // try next selector
    }
  }

  if (!joined) {
    console.log('⚠ Could not auto-join — waiting room or UI changed.');
    await context.close();
    return;
  }

  console.log('🎥 Meeting joined — starting recording...');

  const ffmpegProcess = await startRecording('meeting');

  // Record for 1 minute (change as needed)
  // await page.waitForTimeout(60 * 1000);
  await page.waitForTimeout(30 * 1000);

  console.log('Stopping recording...');
  ffmpegProcess.kill('SIGINT');

  await context.close();
}

main().catch(console.error);
