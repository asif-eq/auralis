// apps/recorder-worker/src/types.ts

export interface StartRecordingOptions {
  meetUrl: string
  outputPath?: string       // optional custom path
  durationSeconds?: number  // optional duration to auto-stop
  userId?: string
  eventId?: string
}

export interface RecordingHandle {
  stop: () => Promise<void>
  filePath: string
}
