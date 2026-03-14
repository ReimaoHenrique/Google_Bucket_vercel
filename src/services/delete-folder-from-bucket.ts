import { config } from "../config/index.js";
import { getStorage } from "../infra/gcs.js";

export async function deleteFolderFromBucket(folderPath: string) {
  if (!config.gcsBucket) {
    throw new Error("GCS_BUCKET nao configurado.");
  }

  const normalizedPrefix = normalizePrefix(folderPath);
  const storage = getStorage();
  const bucket = storage.bucket(config.gcsBucket);

  const [files] = await bucket.getFiles({ prefix: normalizedPrefix, autoPaginate: true });
  if (files.length === 0) {
    return { deleted: 0, prefix: normalizedPrefix };
  }

  await bucket.deleteFiles({ prefix: normalizedPrefix, force: true });

  return {
    prefix: normalizedPrefix,
    deleted: files.length,
  };
}

function normalizePrefix(prefix: string) {
  const trimmed = prefix.trim().replace(/^\/+/, "");
  if (!trimmed) {
    throw new Error("Prefixo informado e invalido.");
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}
