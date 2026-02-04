// apps/recorder-worker/src/recorder/recordMeeting.ts

import { chromium, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

/**
 * Records meeting audio using MediaRecorder inside the browser.
 * One bot = one meeting.
 */

export async function recordMeeting({
  meetingUrl,
  meetingId,
  userDataDir,
  // durationMs = 60 * 60 * 1000, // 1 hour
  // durationMs = 1 * 60 * 1000, // 1 minute
  durationMs = 30 * 1000, // 30 seconds
}: {
  meetingUrl: string;
  meetingId: string;
  userDataDir: string;
  durationMs?: number;
}) {
  const recordingsDir = path.resolve('./recordings');
  fs.mkdirSync(recordingsDir, { recursive: true });

  const outputPath = path.join(recordingsDir, `${meetingId}.webm`);

  const context: BrowserContext = await chromium.launchPersistentContext(
    userDataDir,
    {
      headless: false,
      channel: 'chrome',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--use-fake-ui-for-media-stream', // auto-allow mic/cam
        '--no-sandbox',
      ],
    }
  );

  const page: Page = await context.newPage();

// Attempt to dismiss Chrome crash infobar if present
try {
  const restoreButton = await page.waitForSelector(
    'button:has-text("Restore")',
    { timeout: 3000 }
  );
  await restoreButton.click();
  console.log('ℹ️ Dismissed Chrome restore popup');
} catch {
  // Infobar not present — safe to ignore
}


  // Join meeting
  await page.goto(meetingUrl);

  // Basic join button handling
  const joinSelectors = [
    'button[jsname="Qx7uuf"]',
    'button:has-text("Join now")',
    'button:has-text("Ask to join")',
    'text="Join now"',
    'text="Ask to join"',
  ];

  for (const sel of joinSelectors) {
    try {
      await page.waitForSelector(sel, { timeout: 5000 });
      await page.click(sel);
      break;
    } catch {}
  }

  // Post disclosure message (important for compliance)
  try {
    await page.waitForSelector('textarea', { timeout: 10000 });
    await page.type(
      'textarea',
      ' This meeting is being recorded by Auralis for notes and transcription.'
    );
    await page.keyboard.press('Enter');
  } catch {
    // Chat may be disabled — still okay if bot is visible
  }

  // Wait until Google Meet audio elements are present
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('audio'))
      .some(a => a.srcObject instanceof MediaStream);
  }, { timeout: 30_000 });

  // Inject MediaRecorder to capture Meet audio streams
  await page.evaluate(() => {
    const audioElements = Array.from(document.querySelectorAll('audio'));
    const tracks: MediaStreamTrack[] = [];

    for (const el of audioElements) {
      if (el.srcObject instanceof MediaStream) {
        for (const track of el.srcObject.getAudioTracks()) {
          tracks.push(track);
        }
      }
    }

    if (tracks.length === 0) {
      throw new Error('No audio tracks found to record');
    }

    const stream = new MediaStream(tracks);
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();

    // @ts-ignore
    window.__auralisRecorder = recorder;
    // @ts-ignore
    window.__auralisChunks = chunks;
  });


  console.log(' Recording started');

  // Record for duration
  await page.waitForTimeout(durationMs);

  // Stop recording and pull audio
  const audioData = await page.evaluate(async () => {
    // @ts-ignore
    const recorder = window.__auralisRecorder;
    // @ts-ignore
    const chunks = window.__auralisChunks;

    recorder.stop();

    await new Promise(res => (recorder.onstop = res));

    const blob = new Blob(chunks, { type: 'audio/webm' });
    const arrayBuffer = await blob.arrayBuffer();
    return Array.from(new Uint8Array(arrayBuffer));
  });

  fs.writeFileSync(outputPath, Buffer.from(audioData));

  console.log(`Recording saved → ${outputPath}`);

    // Give Chrome time to release media streams
  await page.waitForTimeout(1000);

  await context.close();
}
