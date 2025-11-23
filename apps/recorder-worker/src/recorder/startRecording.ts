import { chromium, Browser, Page } from 'playwright'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'
import { StartRecordingOptions, RecordingHandle } from '../types'

export async function startRecording({
  meetUrl,
  outputPath,
  durationSeconds = 15
}: StartRecordingOptions): Promise<RecordingHandle> {
  if (!meetUrl) throw new Error('meetUrl is required')

  // 1️⃣ Launch Playwright Chromium
  const browser: Browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    permissions: ['microphone', 'camera']
  })
  const page: Page = await context.newPage()
  await page.goto(meetUrl)

  // 2️⃣ Join meeting and mute mic/camera
  try {
    await page.locator('button[aria-label="Turn off microphone"]').click()
    await page.locator('button[aria-label="Turn off camera"]').click()
  } catch {
    // ignore if buttons not found
  }
  await page.locator('button[aria-label="Join now"]').click()
  console.log('Joined meeting:', meetUrl)

  // 3️⃣ Start ffmpeg recording
  const filePath = outputPath || path.resolve(`tmp/meeting-${Date.now()}.mp4`)
  const ffmpeg: ChildProcessWithoutNullStreams = spawn('ffmpeg', [
    '-y',
    '-f', 'avfoundation', // macOS screen+audio example
    '-i', '1:0',          // screen:audio device
    '-t', durationSeconds.toString(),
    filePath
  ])

  ffmpeg.stdout.on('data', (data) => console.log(`ffmpeg: ${data}`))
  ffmpeg.stderr.on('data', (data) => console.error(`ffmpeg: ${data}`))

  // 4️⃣ Return handle to stop recording
  const handle: RecordingHandle = {
    stop: () =>
      new Promise<void>((resolve, reject) => {
        ffmpeg.on('exit', () => {
          browser.close().then(resolve).catch(reject)
        })
        ffmpeg.kill('SIGINT')
      }),
    filePath
  }

  return handle
}

