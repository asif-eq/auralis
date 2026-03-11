import { chromium, BrowserContext, Page } from 'playwright'
import fs from 'fs'
import path from 'path'

// const MEET_URL = 'https://meet.google.com/qwr-umng-kuy'
const MEET_URL = 'https://meet.google.com/kba-bhqk-jjh'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
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

  await page.goto(MEET_URL)

  console.log('Waiting for meeting UI...')
  await sleep(5000)

  await injectSpeakerTracker(page)

  console.log('Tracking speakers for 60 seconds...')
  await sleep(60000)

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