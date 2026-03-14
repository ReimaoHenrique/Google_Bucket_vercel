import type { FastifyInstance } from "fastify";

import { config } from "./config.js";
import { buildObjectName } from "./object-name.js";
import { getStorage } from "./storage.js";

async function uploadToBucket(
  fileBytes: Uint8Array | Buffer,
  filename: string,
  contentType: string,
) {
  if (!config.gcsBucket) {
    throw new Error("GCS_BUCKET nao configurado.");
  }

  const objectName = buildObjectName(config.filePrefix, filename);
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

export function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true }));

  app.post("/upload", async (request, reply) => {
    if (!config.gcsBucket) {
      return reply.status(500).send({
        ok: false,
        error: "GCS_BUCKET nao configurado.",
      });
    }

    const file = await request.file();
    if (!file) {
      return reply.status(400).send({
        ok: false,
        error: 'Envie um arquivo no campo "file" (multipart/form-data).',
      });
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of file.file) {
      chunks.push(chunk);
    }
    const totalSize = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const fileBytes = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      fileBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const contentType = file.mimetype || "application/octet-stream";

    let objectName: string;
    let publicUrl: string | undefined;
    try {
      const result = await uploadToBucket(
        fileBytes,
        file.filename,
        contentType,
      );
      objectName = result.objectName;
      publicUrl = result.publicUrl;
    } catch (error) {
      request.log.error({ err: error }, "Falha ao enviar arquivo para o GCS.");
      return reply.status(500).send({
        ok: false,
        error:
          "Falha ao fazer upload para o bucket. Verifique credenciais e permissoes no GCP.",
      });
    }

    return reply.status(201).send({
      ok: true,
      bucket: config.gcsBucket,
      objectName,
      contentType,
      size: fileBytes.byteLength,
      gcsUri: `gs://${config.gcsBucket}/${objectName}`,
      publicUrl,
    });
  });

  app.post("/upload-base64", async (request, reply) => {
    if (!config.gcsBucket) {
      return reply.status(500).send({
        ok: false,
        error: "GCS_BUCKET nao configurado.",
      });
    }

    const body = request.body as
      | {
          data?: string;
          filename?: string;
          contentType?: string;
        }
      | undefined;

    if (!body?.data || !body?.filename) {
      return reply.status(400).send({
        ok: false,
        error: 'Envie "data" (base64) e "filename" no corpo JSON.',
      });
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(body.data, "base64");
      if (fileBuffer.length === 0) {
        throw new Error("empty");
      }
    } catch {
      return reply.status(400).send({
        ok: false,
        error: 'Base64 invalido em "data".',
      });
    }

    if (fileBuffer.byteLength > config.maxFileSizeBytes) {
      return reply.status(413).send({
        ok: false,
        error: `Arquivo excede limite de ${config.maxFileSizeBytes} bytes.`,
      });
    }

    const contentType = body.contentType ?? "image/jpeg";

    let objectName: string;
    let publicUrl: string | undefined;
    try {
      const result = await uploadToBucket(
        fileBuffer,
        body.filename,
        contentType,
      );
      objectName = result.objectName;
      publicUrl = result.publicUrl;
    } catch (error) {
      request.log.error({ err: error }, "Falha ao enviar base64 para o GCS.");
      return reply.status(500).send({
        ok: false,
        error:
          "Falha ao fazer upload para o bucket. Verifique credenciais e permissoes no GCP.",
      });
    }

    return reply.status(201).send({
      ok: true,
      bucket: config.gcsBucket,
      objectName,
      contentType,
      size: fileBuffer.byteLength,
      gcsUri: `gs://${config.gcsBucket}/${objectName}`,
      publicUrl,
    });
  });
}
