// apps/recorder-worker/src/recorder/stopRecording.ts
import { ChildProcess } from 'child_process'
import { Browser, BrowserContext } from 'playwright'
import { logger } from '../utils/logger'

export type RecordingHandle = {
  ffmpeg?: ChildProcess | null
  browser?: Browser | null
  context?: BrowserContext | null
  outputPath?: string
}

/**
 * Gracefully stops a recording:
 * - sends SIGINT to ffmpeg (preferred) and falls back to SIGTERM
 * - waits for the process to exit
 * - closes Playwright context and browser
 *
 * Returns a promise that resolves when shutdown is complete.
 */
export async function stopRecording(handle: RecordingHandle): Promise<void> {
  try {
    // 1) stop ffmpeg if present
    if (handle.ffmpeg && !handle.ffmpeg.killed) {
      logger.info('Stopping ffmpeg process (SIGINT)')
      try {
        // prefer graceful shutdown
        handle.ffmpeg.kill('SIGINT')
      } catch (err) {
        logger.error('Failed to send SIGINT to ffmpeg, trying SIGTERM', err)
        try {
          handle.ffmpeg.kill('SIGTERM')
        } catch (err2) {
          logger.error('Failed to send SIGTERM to ffmpeg', err2)
        }
      }

      // wait for ffmpeg to exit (timeout fallback)
      await new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          logger.error('ffmpeg did not exit in time; force killing')
          try {
            handle.ffmpeg?.kill('SIGKILL')
          } catch (e) {
            logger.error('Failed to SIGKILL ffmpeg', e)
          }
          resolve()
        }, 10_000) // 10s grace

        handle.ffmpeg?.once('exit', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      logger.info('ffmpeg stopped')
    }

    // 2) close Playwright context/browser
    if (handle.context) {
      try {
        logger.info('Closing browser context')
        await handle.context.close()
      } catch (err) {
        logger.error('Error closing browser context', err)
      }
    }

    if (handle.browser) {
      try {
        logger.info('Closing browser')
        await handle.browser.close()
      } catch (err) {
        logger.error('Error closing browser', err)
      }
    }

    logger.info('Recording shutdown complete')
  } catch (err) {
    logger.error('Error during stopRecording', err)
    // swallow to avoid crashing worker loop; caller can decide to rethrow if needed
  }
}
