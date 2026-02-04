// apps/recorder-worker/src/utils/testJoinAndRecordMeeting.ts

import { recordMeeting } from '../recorder/joinAndRecordMeeting';

async function main() {
  // HARD-CODED TEST VALUES
  const meetingUrl = 'https://meet.google.com/qwr-umng-kuy';
  const meetingId = 'test-meeting-auralis';

  console.log('Starting test recorder bot...');
  console.log('Meeting URL:', meetingUrl);

  await recordMeeting({
    meetingUrl,
    meetingId,
    userDataDir: `/tmp/auralis-bot/${meetingId}`,
    durationMs: 30 * 1000, // 30 seconds
  });

  console.log('Test recording finished');
}

main().catch(err => {
  console.error('Test recorder failed:', err);
  process.exit(1);
});
