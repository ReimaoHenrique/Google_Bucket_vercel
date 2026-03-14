import type { FastifyInstance } from "fastify";
import type { MultipartFile } from "@fastify/multipart";

import { config } from "../config/index.js";
import { uploadToBucket } from "../services/upload-to-bucket.js";

export function registerMultipartUploadRoute(app: FastifyInstance) {
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

    const fileBytes = await collectFileBytes(file);
    const contentType = file.mimetype || "application/octet-stream";

    try {
      const result = await uploadToBucket(fileBytes, file.filename, contentType);
      return reply.status(201).send({
        ok: true,
        bucket: config.gcsBucket,
        objectName: result.objectName,
        contentType,
        size: fileBytes.byteLength,
        gcsUri: `gs://${config.gcsBucket}/${result.objectName}`,
        publicUrl: result.publicUrl,
      });
    } catch (error) {
      request.log.error({ err: error }, "Falha ao enviar arquivo para o GCS.");
      return reply.status(500).send({
        ok: false,
        error:
          "Falha ao fazer upload para o bucket. Verifique credenciais e permissoes no GCP.",
      });
    }
  });
}

async function collectFileBytes(file: MultipartFile) {
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

  return fileBytes;
}
