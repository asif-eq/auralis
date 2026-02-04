export interface PlatformAdapter {
  join(meetingUrl: string): Promise<void>
  waitUntilReady(): Promise<void>
  leave(): Promise<void>
}
