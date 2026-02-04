import { chromium, BrowserContext, Page } from 'playwright'
import { PlatformAdapter } from '../types'
import { joinGoogleMeet } from './join'

export class GoogleMeetAdapter implements PlatformAdapter {
  private context!: BrowserContext
  private page!: Page

  constructor(private userDataDir: string) {}

  async join(meetingUrl: string) {
    this.context = await chromium.launchPersistentContext(
      this.userDataDir,
      {
        headless: false,
        channel: 'chrome',
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--use-fake-ui-for-media-stream',
          '--no-sandbox',
        ],
      }
    )

    this.page = await this.context.newPage()

    await joinGoogleMeet(this.page, meetingUrl)
  }

  async waitUntilReady() {
    // already ensured by joinGoogleMeet for now
  }

  getPage(): Page {
    return this.page
  }

  async leave() {
    await this.context?.close()
  }
}
