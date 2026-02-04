// apps/recorder-worker/src/browser/autoJoinAndRecord.ts

import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

async function startRecording(meetingId: string) {
  // Timestamped filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const output = path.resolve(`./recordings/${meetingId}-${timestamp}.mkv`);
  fs.mkdirSync('./recordings', { recursive: true });

  console.log(`🎥 Recording started -> ${output}`);

  const ffmpeg = spawn('ffmpeg', [
    '-f', 'avfoundation',
    '-framerate', '30',
    '-i', '1:1',           // screen + system audio
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

async function main() {
  const userDataDir = path.resolve('/Users/asif/Library/Application Support/Google/Chrome/Default');

  const context: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--use-fake-ui-for-media-stream',     // auto-allow permissions
      '--use-fake-device-for-media-stream', // fake mic + camera
      '--enable-usermedia-screen-capturing', 
      '--auto-select-desktop-capture-source=Google Meet',
      '--no-sandbox',
      '--mute-audio',                        // optional, ensures no sound from bot
      // '--disable-audio-input',

    ],
  });

  const page: Page = await context.newPage();
  await page.goto('https://meet.google.com/rjb-gmcd-rqg');

  console.log("🔍 Searching for Join buttons...");

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
    } catch {}
  }

  if (!joined) {
    console.log("⚠ Join UI didn’t appear — maybe in waiting room or already in call.");
    return;
  }

  console.log("🎥 You're now inside the meeting — starting recording...");

  // Start recording (timestamped)
  const ffmpeg = await startRecording('test-meeting');

  // For MVP, stop after 30 seconds
  await page.waitForTimeout(30 * 1000);
  ffmpeg.kill('SIGINT');

  console.log("⏹ Recording stopped after 30 seconds");

  await context.close();
}

main().catch(console.error);
