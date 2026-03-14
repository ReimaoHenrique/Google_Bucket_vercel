import { buildApp } from './src/create-app.js'

const app = await buildApp()

export default async (req: any, res: any) => {
  await app.ready()
  app.server.emit('request', req, res)
}