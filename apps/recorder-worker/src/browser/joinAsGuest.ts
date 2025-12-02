import { chromium } from 'playwright';

export async function joinAsGuest(meetUrl: string) {
  const context = await chromium.launchPersistentContext('./guest-profile', {
    headless: false,
    channel: 'chrome',
    permissions: ['microphone', 'camera'],
    args: [
      '--use-fake-ui-for-media-stream',
      '--no-default-browser-check',
      '--no-first-run'
    ]
  });

  const page = context.pages()[0] ?? await context.newPage();
  await page.goto(meetUrl, { waitUntil: 'networkidle' });

  console.log("🔹 Filling Guest Name");
  const nameInput = await page.waitForSelector('input[aria-label="Your name"]', { state: 'visible', timeout: 10000 });
  await nameInput.fill('Auralis Bot');

  console.log("🔹 Pre-join mute mic & cam");
  await page.locator('button[aria-label*="Turn off microphone"]').first().click().catch(() => {});
  await page.locator('button[aria-label*="Turn off camera"]').first().click().catch(() => {});

  console.log("🔹 Clicking Join/Ask Now");
  const joinBtn = await page.locator('button:text("Join now"), button:text("Ask to join")').first();
  await joinBtn.click();

  console.log("🚀 Guest has joined — ready for recording");
  return { context, page };
}

// Run directly
(async () => {
  await joinAsGuest("https://meet.google.com/rjb-gmcd-rqg");
})();
