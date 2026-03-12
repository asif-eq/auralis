import { chromium, BrowserContext, Page } from 'playwright'
import fs from 'fs'
import path from 'path'

// const MEET_URL = 'https://meet.google.com/qwr-umng-kuy'
const MEET_URL = 'https://meet.google.com/kba-bhqk-jjh'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function disableMicAndCamera(page: Page) {

  const mic = page.locator('button[aria-label*="microphone"]')
  const cam = page.locator('button[aria-label*="camera"]')

  try {
    const micMuted = await mic.getAttribute('data-is-muted')

    if (micMuted === 'false') {
      console.log('Muting microphone...')
      await mic.click()
    }
  } catch {
    console.log('Mic button not found')
  }

  try {
    const camMuted = await cam.getAttribute('data-is-muted')

    if (camMuted === 'false') {
      console.log('Turning camera off...')
      await cam.click()
    }
  } catch {
    console.log('Camera button not found')
  }

}

async function handleSwitchHere(page: Page) {
  try {
    const switchHere = page.getByRole('button', { name: /switch here/i })
    if (await switchHere.isVisible({ timeout: 5000 })) {
      console.log('Clicking Switch here...')
      await switchHere.click()
    }
  } catch {}
}

async function clickJoinButtons(page: Page) {
  try {
    const joinNow = page.getByRole('button', { name: /join now/i })

    if (await joinNow.isVisible({ timeout: 5000 })) {
      console.log('Clicking Join now...')
      await joinNow.click()
      return
    }
  } catch {}

  try {
    const askToJoin = page.getByRole('button', { name: /ask to join/i })

    if (await askToJoin.isVisible({ timeout: 5000 })) {
      console.log('Clicking Ask to join...')
      await askToJoin.click()
      return
    }
  } catch {}

  console.log('No join button found.')
}

async function waitForMeetingJoin(page: Page) {

  try {

    await page.waitForSelector(
      'button[aria-label*="Leave call"]',
      { timeout: 60000 }
    )

    console.log('Successfully joined meeting')

  } catch {

    console.log('Meeting join state not detected')

  }

}

async function injectSpeakerTracker(page: Page) {
  await page.evaluate(`
    (() => {

      const timeline = [];
      let lastSpeaker = null;
      let lastChange = 0;
      const start = Date.now();

      function timestamp() {
        return (Date.now() - start) / 1000;
      }

      function isValidName(name) {
        if (!name) return false;

        const invalid = [
            'keep_outline',
            'devices',
            'mic',
            'videocam',
            'unknown'
        ];

        return !invalid.includes(name.toLowerCase());
      }

      setInterval(() => {

        const tiles = document.querySelectorAll('[data-participant-id]');

        tiles.forEach(tile => {

        const name =
          tile.querySelector('.XEazBc span.notranslate')?.textContent?.trim();

          const indicator = tile.querySelector('.DYfzY');

          if (!indicator) return;
          if (!isValidName(name)) return;

          if (indicator.classList.contains('sxlEM')) {

            const now = Date.now();

            if (
              name !== lastSpeaker &&
              now - lastChange > 500
            ) {

              lastSpeaker = name;
              lastChange = now;

              timeline.push({
                speaker: name,
                time: timestamp()
              });

              console.log('Speaker change →', name);

            }

          }

        });

      }, 250);

      window.__auralisSpeakers = timeline;

    })();
  `);
}

async function getSpeakers(page: Page) {
  return page.evaluate(() => {
    return (window as any).__auralisSpeakers || []
  })
}

async function waitForMeetingEnd(page: Page) {
  await page.waitForSelector(
    'button[aria-label*="Leave call"]',
    { state: 'detached' ,
    timeout: 0
  }
  )

  console.log('Meeting ended')
}

async function main() {

  const userDataDir = path.resolve(
    '/Users/asif/Library/Application Support/Google/Chrome/AuralisBot'
  )

  const context: BrowserContext =
    await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome'
    })

  const page: Page = await context.newPage()

  console.log('Opening meeting:', MEET_URL)

  await page.goto(MEET_URL)

  await page.waitForTimeout(6000)

  // await disableMicAndCamera(page)
  
  await clickJoinButtons(page) 

  await handleSwitchHere(page)

  await waitForMeetingJoin(page)

  await disableMicAndCamera(page)

  await injectSpeakerTracker(page)


  console.log('Tracking speakers...')

  await Promise.race([
    sleep(120000),
    waitForMeetingEnd(page)
  ])

 console.log('Stopping recorder')

  const speakers = await getSpeakers(page)

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')

  const output = path.resolve(
    `./recordings/speakers_${timestamp}.json`
  )

  fs.writeFileSync(
    output,
    JSON.stringify(speakers, null, 2)
  )

  console.log('Saved speaker timeline →', output)

  await context.close()

}

main().catch(console.error)