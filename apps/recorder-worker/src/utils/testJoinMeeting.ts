import { GoogleMeetAdapter } from '../platforms/google-meet/adapter'
import { recordMeeting } from '../recorder/record'

async function main() {
  // HARD-CODED TEST VALUES (same as before)
  const meetingUrl = 'https://meet.google.com/qwr-umng-kuy'
  const meetingId = 'test-meeting-auralis'
  const userDataDir = `/tmp/auralis-bot/${meetingId}`

  console.log('Starting test recorder bot...')
  console.log('Meeting URL:', meetingUrl)

  // 1️⃣ Create platform adapter
  const adapter = new GoogleMeetAdapter(userDataDir)

  try {
    // 2️⃣ Join the meeting (platform responsibility)
    await adapter.join(meetingUrl)
    await adapter.waitUntilReady()

    // 3️⃣ Record the meeting (recorder responsibility)
    await recordMeeting({
      page: adapter.getPage(),
      meetingId,
      durationMs: 30 * 1000, // 30 seconds
    })

    console.log('Test recording finished')
  } finally {
    // 4️⃣ Always clean up browser
    await adapter.leave()
  }
}

main().catch(err => {
  console.error('Test recorder failed:', err)
  process.exit(1)
})

