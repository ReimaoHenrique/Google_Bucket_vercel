import { Storage } from '@google-cloud/storage'

type ServiceAccountCredentials = {
  project_id: string
  client_email: string
  private_key: string
}

function parseCredentialsFromEnv() {
  const rawJson =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ?? process.env.GCP_CREDENTIALS_JSON
  if (rawJson) {
    try {
      return JSON.parse(rawJson) as ServiceAccountCredentials
    } catch {
      throw new Error(
        'Credenciais invalidas em GOOGLE_APPLICATION_CREDENTIALS_JSON/GCP_CREDENTIALS_JSON.'
      )
    }
  }

  if (process.env.GCP_CREDENTIALS_BASE64) {
    try {
      const decoded = Buffer.from(process.env.GCP_CREDENTIALS_BASE64, 'base64').toString('utf8')
      return JSON.parse(decoded) as ServiceAccountCredentials
    } catch {
      throw new Error('Credenciais invalidas em GCP_CREDENTIALS_BASE64.')
    }
  }

  return undefined
}

function createStorageClient() {
  const credentials = parseCredentialsFromEnv()

  if (!credentials) {
    return new Storage()
  }

  return new Storage({
    projectId: credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key
    }
  })
}

let storageClient: Storage | undefined
let storageInitError: Error | undefined

export function getStorage() {
  if (storageClient) {
    return storageClient
  }

  if (storageInitError) {
    throw storageInitError
  }

  try {
    storageClient = createStorageClient()
    return storageClient
  } catch (error) {
    storageInitError =
      error instanceof Error ? error : new Error('Falha ao inicializar cliente do Google Storage.')
    throw storageInitError
  }
}
