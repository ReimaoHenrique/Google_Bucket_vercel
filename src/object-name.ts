import { randomUUID } from 'node:crypto'

export function buildObjectName(filePrefix: string, filename: string) {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${filePrefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeFilename}`
}

