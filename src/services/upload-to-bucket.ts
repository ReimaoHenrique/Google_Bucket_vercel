import { config } from "../config/index.js";
import { buildObjectName } from "../object-name.js";
import { getStorage } from "../infra/gcs.js";

export async function uploadToBucket(
  fileBytes: Uint8Array | Buffer,
  filename: string,
  contentType: string,
  folderSubpath?: string,
) {
  if (!config.gcsBucket) {
    throw new Error("GCS_BUCKET nao configurado.");
  }

  const objectName = buildObjectName(
    resolveFilePrefix(folderSubpath),
    filename,
  );
  const storage = getStorage();
  const bucket = storage.bucket(config.gcsBucket);
  const gcsFile = bucket.file(objectName);

  await gcsFile.save(fileBytes, {
    contentType,
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  let publicUrl: string | undefined;
  if (config.makePublic) {
    await gcsFile.makePublic();
    publicUrl = `https://storage.googleapis.com/${config.gcsBucket}/${objectName}`;
  }

  return {
    objectName,
    publicUrl,
  };
}

function resolveFilePrefix(folderSubpath?: string) {
  const segments: string[] = [];

  if (config.filePrefix) {
    segments.push(trimSlashes(config.filePrefix));
  }

  if (folderSubpath) {
    segments.push(folderSubpath);
  }

  if (segments.length === 0) {
    return "uploads";
  }

  return segments.join("/");
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}
