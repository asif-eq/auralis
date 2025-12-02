import { Worker } from './worker'
import { logger } from './utils/logger'

async function main() {
  logger.info('Recorder Worker started')

  // Create a Worker instance
  const meetUrl = process.env.MEET_URL || 'https://meet.google.com/your-meet-id'
  const outputDir = process.env.OUTPUT_DIR || './recordings'
  const worker = new Worker(meetUrl, outputDir)

  // Run the worker
  await worker.init()
}

main().catch(err => {
  logger.error('Fatal error in Recorder Worker:', err)
  process.exit(1)
})
