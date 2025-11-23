export async function joinMeeting(page, meetUrl: string) {
  await page.goto(meetUrl, { waitUntil: 'networkidle' })

  // Disable mic & camera
  await page.keyboard.press('KeyM')
  await page.keyboard.press('KeyC')

  // Click 'Join now'
  await page.waitForSelector('button[jsname="Qx7uuf"]', { timeout: 15000 })
  await page.click('button[jsname="Qx7uuf"]')

  // Wait inside meeting
  await page.waitForSelector('[data-unified-share-panel]', { timeout: 20000 })
}
