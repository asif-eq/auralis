import { chromium, BrowserContext } from 'playwright';

export async function launchPersistentBrowser(): Promise<BrowserContext> {
  const context = await chromium.launchPersistentContext('.chrome-profile', {
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  return context; //
}




