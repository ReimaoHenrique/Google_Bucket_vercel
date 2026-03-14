import multipart from '@fastify/multipart'
import Fastify from 'fastify'

import { config } from './config/index.js'
import { registerRoutes } from './routes.js'

export async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: config.maxFileSizeBytes
    }
  })

  registerRoutes(app)
  return app
}
