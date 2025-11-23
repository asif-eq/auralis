// apps/recorder-worker/src/scripts/testRecording.ts
import path from 'path'
import { startRecording } from '../recorder/startRecording'
import { stopRecording } from '../recorder/stopRecording'

async function test() {
  const outputPath = path.resolve(`tmp/test-meeting-${Date.now()}.mp4`)
  
  const handle = await startRecording({
    meetUrl: 'https://meet.google.com/rjb-gmcd-rqg', // your test meeting
    durationSeconds: 15,
    outputPath
  })

  console.log('Recording started… waiting to finish automatically…')

  // Optional: stop manually (not strictly needed if durationSeconds is set)
  await handle.stop()

  console.log('Recording saved at:', handle.filePath)
}

test().catch(console.error)
