// apps/recorder-worker/src/browser/autoJoinAndRecordv2.ts

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

  console.log(` Recording started -> ${output}`);

  const ffmpeg = spawn('ffmpeg', [
    '-f', 'avfoundation',
    '-framerate', '30',
    '-i', '1:0',            // macOS: screen:system audio
    '-vcodec', 'libx264',
    '-preset', 'fast',
    '-acodec', 'aac',
    '-b:a', '128k',
    output,
  ]);

  ffmpeg.stderr.on('data', data => {
    const text = data.toString();
    if (text.includes('frame=')) process.stdout.write(`🟢 Capturing video...\r`);
  });

  ffmpeg.on('close', () => console.log(`📁 Recording saved -> ${output}`));

  return ffmpeg;
}

// ------------------------------
// Main auto-join + record
// ------------------------------
async function main() {
  // 🔹 Dedicated bot profile (safe)
  const userDataDir = path.resolve(
    '/Users/asif/Library/Application Support/Google/Chrome/AuralisBot'
  );
  fs.mkdirSync(userDataDir, { recursive: true });

  const context: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',

      // Prevent feedback beep
      // '--mute-audio',

      // // Fake devices to avoid OS mic/camera popup
      // '--use-fake-ui-for-media-stream',
      // '--use-fake-device-for-media-stream',

      '--disable-audio-input',
      '--no-sandbox',
    ],
  });

  const page: Page = await context.newPage();
  // await page.goto('https://meet.google.com/rjb-gmcd-rqg');
  await page.goto('https://meet.google.com/cps-pcrb-vfj');
  
  console.log('🔍 Searching for Join buttons...');

  const selectors = [
    'button[jsname="Qx7uuf"]',           // Join now
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
    console.log('⚠ Could not auto-join — waiting room or UI changed.');
    await context.close();
    return;
  }

  console.log(" Meeting joined — starting recording...");

  const ffmpegProcess = await startRecording('meeting');

  // Keep recording for 1 hour (adjust as needed)
  await page.waitForTimeout(1000 * 60 * 1);

  // Stop recording
  ffmpegProcess.kill('SIGINT');
  await context.close();
}

main().catch(console.error);
