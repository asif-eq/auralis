import path from 'path';
import fs from 'fs';
import { joinMeeting } from './browser/joinMeeting';
import { startRecording } from './recorder/startRecording';
import { stopRecording } from './recorder/stopRecording';
import { logger } from './utils/logger';
import { uploadRecording } from './utils/upload'; // Implement this for S3/API

export class Worker {
  private meetUrl: string;
  private outputDir: string;

  constructor(meetUrl: string, outputDir: string) {
    this.meetUrl = meetUrl;
    this.outputDir = outputDir;
  }

  public async init() {
    try {
      // Ensure output folder exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
        logger.info(`Created output folder: ${this.outputDir}`);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = path.join(this.outputDir, `meeting-${timestamp}.mp4`);

      // Launch Playwright and join meeting
      logger.info(`Joining Google Meet: ${this.meetUrl}`);
      const { page, context } = await joinMeeting(this.meetUrl);

      // Start recording
      logger.info(`Starting recording to ${outputFile}`);
      const ffmpegProcess = startRecording(outputFile);

      // Wait for meeting duration
      logger.info('Recording in progress...');
      // TODO: Replace fixed timeout with dynamic meeting end detection
      await page.waitForTimeout(60 * 60 * 1000); // 1 hour example

      // Stop recording
      logger.info('Stopping recording...');
      // stopRecording(ffmpegProcess);

      // Upload recording
      logger.info('Uploading recording...');
      await uploadRecording(outputFile);

      // Cleanup
      await context.close();
      logger.info('Recording job completed successfully.');
    } catch (err) {
      logger.error('Error in recorder worker:', err);
    }
  }
}

// Optional CLI entry for direct run
if (require.main === module) {
  const meetUrl = process.env.MEET_URL || 'https://meet.google.com/your-meet-id';
  const outputDir = process.env.OUTPUT_DIR || './recordings';

  const worker = new Worker(meetUrl, outputDir);
  worker.init().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}
