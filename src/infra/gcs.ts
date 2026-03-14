import { Storage } from "@google-cloud/storage";

import { getGcpCredentials } from "../config/gcp-credentials.js";

let storage: Storage | null = null;

export function getStorage() {
  if (storage) {
    return storage;
  }

  const credentials = getGcpCredentials();

  storage = credentials
    ? new Storage({
        projectId: credentials.project_id,
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
      })
    : new Storage();

  return storage;
}
