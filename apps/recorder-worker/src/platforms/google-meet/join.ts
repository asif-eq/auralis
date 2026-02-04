import { Page } from 'playwright';

export async function joinGoogleMeet(page: Page, meetingUrl: string) {
  await page.goto(meetingUrl)

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
  } catch {}

  // Wait until Google Meet audio elements are present
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('audio'))
      .some(a => a.srcObject instanceof MediaStream);
  }, { timeout: 30_000 })

}
