import type { FastifyInstance } from "fastify";

import { config } from "../config.js";
import { uploadToBucket } from "../services/upload-to-bucket.js";

type UploadBase64Body = {
  data?: string;
  filename?: string;
  contentType?: string;
};

export function registerBase64UploadRoute(app: FastifyInstance) {
  app.post("/upload-base64", async (request, reply) => {
    if (!config.gcsBucket) {
      return reply.status(500).send({
        ok: false,
        error: "GCS_BUCKET nao configurado.",
      });
    }

    const body = request.body as UploadBase64Body | undefined;
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

    try {
      const result = await uploadToBucket(
        fileBuffer,
        body.filename,
        contentType,
      );
      return reply.status(201).send({
        ok: true,
        bucket: config.gcsBucket,
        objectName: result.objectName,
        contentType,
        size: fileBuffer.byteLength,
        gcsUri: `gs://${config.gcsBucket}/${result.objectName}`,
        publicUrl: result.publicUrl,
      });
    } catch (error) {
      request.log.error({ err: error }, "Falha ao enviar base64 para o GCS.");
      return reply.status(500).send({
        ok: false,
        error:
          "Falha ao fazer upload para o bucket. Verifique credenciais e permissoes no GCP.",
      });
    }
  });
}
