import { Page } from 'playwright'
import fs from 'fs'
import path from 'path'

/**
 * Records meeting audio using MediaRecorder inside the browser.
 * Assumes the bot is already in the meeting.
 */

export async function recordMeeting({
  page,
  meetingId,
  durationMs = 30_000, // default: 30 seconds
}: {
  page: Page
  meetingId: string
  durationMs?: number
}) {
  const recordingsDir = path.resolve('./recordings')
  fs.mkdirSync(recordingsDir, { recursive: true })

  const outputPath = path.join(recordingsDir, `${meetingId}.webm`)

  // Inject MediaRecorder to capture Meet audio streams
  await page.evaluate(() => {
    const audioElements = Array.from(document.querySelectorAll('audio'))
    const tracks: MediaStreamTrack[] = []

    for (const el of audioElements) {
      if (el.srcObject instanceof MediaStream) {
        for (const track of el.srcObject.getAudioTracks()) {
          tracks.push(track)
        }
      }
    }

    if (tracks.length === 0) {
      throw new Error('No audio tracks found to record')
    }

    const stream = new MediaStream(tracks)
    const recorder = new MediaRecorder(stream)
    const chunks: BlobPart[] = []

    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.start()

    // @ts-ignore
    window.__auralisRecorder = recorder
    // @ts-ignore
    window.__auralisChunks = chunks
  })

  console.log('🎙️ Recording started')

  // Record for the requested duration
  await page.waitForTimeout(durationMs)

  // Stop recording and pull audio data
  const audioData = await page.evaluate(async () => {
    // @ts-ignore
    const recorder = window.__auralisRecorder
    // @ts-ignore
    const chunks = window.__auralisChunks

    recorder.stop()

    await new Promise(res => (recorder.onstop = res))

    const blob = new Blob(chunks, { type: 'audio/webm' })
    const arrayBuffer = await blob.arrayBuffer()
    return Array.from(new Uint8Array(arrayBuffer))
  })

  fs.writeFileSync(outputPath, Buffer.from(audioData))

  console.log(`✅ Recording saved → ${outputPath}`)

  // Give Chrome time to release media streams
  await page.waitForTimeout(1000)
}
