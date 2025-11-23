// apps/recorder-worker/src/utils/env.ts
import path from 'path'
import { config as loadDotenv } from 'dotenv'

loadDotenv({ path: path.resolve(process.cwd(), '.env') })

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function optionalNumber(name: string, fallback: number): number {
  const v = process.env[name]
  return v ? Number(v) : fallback
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEV: (process.env.NODE_ENV || 'development') === 'development',

  // Redis (Bull/BullMQ)
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: optionalNumber('REDIS_PORT', 6379),

  // Queue names
  RECORDING_QUEUE: process.env.RECORDING_QUEUE || 'recording-jobs',

  // Google / OAuth (used by scanner / recorder when impersonating/user context)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

  // S3 / Storage for uploaded recordings
  S3_BUCKET: process.env.S3_BUCKET || '',
  S3_REGION: process.env.S3_REGION || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',

  // ffmpeg binary (allow custom path)
  FFMPEG_PATH: process.env.FFMPEG_PATH || 'ffmpeg',

  // Worker tuning
  MAX_RECORDING_SECONDS: optionalNumber('MAX_RECORDING_SECONDS', 60 * 60), // 1 hour default

  // Local temp dir for recordings
  TMP_DIR: process.env.TMP_DIR || path.resolve(process.cwd(), 'tmp')
}

/**
 * Validate required env vars that are critical at runtime.
 * Call at app startup (importing this module already loads .env).
 */
export function validateEnv() {
  // Only require the truly necessary ones for recorder-worker.
  // If scanner/other workers need more, they can validate as well.
  if (!env.S3_BUCKET) {
    // if you prefer local storage during dev, don't throw — log instead
    if (!env.DEV) throw new Error('S3_BUCKET is required in non-dev mode')
  }

  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    if (!env.DEV) throw new Error('AWS credentials are required in non-dev mode')
  }

  // Redis must be available
  if (!env.REDIS_HOST) throw new Error('REDIS_HOST is required')

  // optional: warn about missing Google client config (scanner needs this)
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    // don't throw here — recorder may run with per-user tokens instead
    // but logging a warning is useful
    // (assuming a logger is available where this is called)
  }
}
