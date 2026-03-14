const PORT = Number(process.env.PORT ?? 3000)
const HOST = process.env.HOST ?? '127.0.0.1'
const GCS_BUCKET = process.env.GCS_BUCKET
const FILE_PREFIX = process.env.GCS_UPLOAD_PREFIX ?? 'uploads'
const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_BYTES ?? 10 * 1024 * 1024)
const MAKE_PUBLIC = process.env.GCS_PUBLIC === 'true'

export const config = {
  port: PORT,
  host: HOST,
  gcsBucket: GCS_BUCKET,
  filePrefix: FILE_PREFIX,
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  makePublic: MAKE_PUBLIC
}

