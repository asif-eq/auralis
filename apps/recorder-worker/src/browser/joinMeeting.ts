import { BrowserContext, Page } from 'playwright';
import { launchPersistentBrowser } from './launchBrowser';
import { logger } from '../utils/logger';

export async function joinMeeting(meetUrl: string): Promise<{ page: Page; context: BrowserContext }> {
  const context = await launchPersistentBrowser();
  const page = await context.newPage(); // Create a Page from BrowserContext

  await page.goto(meetUrl, { waitUntil: 'networkidle' }); // Use page.goto, not context.goto

  // Click "Join now" button if present
  try {
    await page.waitForSelector('button[jsname="Qx7uuf"]', { timeout: 15000 });
    await page.click('button[jsname="Qx7uuf"]');
    logger.info('Clicked "Join now" button');
  } catch (err) {
    logger.warn('Could not automatically click "Join now":', err);
  }

  return { page, context }; // Return both
}


