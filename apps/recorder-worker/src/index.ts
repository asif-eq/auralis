import { Worker } from './worker'
import { logger } from './utils/logger'

async function main() {
  logger.info('Recorder Worker started')
  Worker.init()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
