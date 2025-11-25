import { joinMeeting } from '../browser/joinMeeting';
import { logger } from './logger';

async function test() {
  const meetUrl = process.env.MEET_URL || 'https://meet.google.com/rjb-gmcd-rqg';

  try {
    const { page, context } = await joinMeeting(meetUrl);

    logger.info('Joined the meeting! Waiting 30 seconds to confirm...');
    await page.waitForTimeout(30000);

    await context.close();
    logger.info('Test finished successfully.');
  } catch (err) {
    logger.error('Error during testJoinMeet:', err);
  }
}

test();


