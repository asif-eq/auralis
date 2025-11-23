import { QueueEvents, Worker as BullWorker } from 'bullmq'
import { startRecording } from './recorder/startRecording'
import { logger } from './utils/logger'
import { env } from './utils/env'

export const Worker = {
  init() {
    const queueName = 'recording-jobs'

    new BullWorker(
      queueName,
      async job => {
        logger.info(`Received job: ${job.id}`)
        const { userId, eventId, meetUrl } = job.data

        await startRecording({ userId, eventId, meetUrl })
        
        logger.info(`Job completed: ${job.id}`)
      },
      {
        connection: {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT
        }
      }
    )

    new QueueEvents(queueName, {
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT
      }
    })
  }
}
