import type { FastifyInstance } from "fastify";
import type { Multipart, MultipartFile } from "@fastify/multipart";

import { config } from "../config/index.js";
import { uploadToBucket } from "../services/upload-to-bucket.js";

type UploadQuerystring = {
  placa?: string;
};

export function registerMultipartUploadRoute(app: FastifyInstance) {
  app.post<{ Querystring: UploadQuerystring }>("/upload", async (request, reply) => {
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
    const placaFromFields = extractFieldValue(file.fields.placa);
    const placaFromQuery = request.query.placa;
    const folderSubpath = buildFolderSubpath(placaFromFields ?? placaFromQuery);

    try {
      const result = await uploadToBucket(
        fileBytes,
        file.filename,
        contentType,
        folderSubpath,
      );
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

function extractFieldValue(
  field?: Multipart | Multipart[] | undefined,
): string | undefined {
  if (!field) {
    return undefined;
  }

  const firstField = Array.isArray(field) ? field[0] : field;
  if (!firstField || firstField.type !== "field") {
    return undefined;
  }

  const { value } = firstField;
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Buffer.isBuffer(value)) {
    return value.toString("utf-8");
  }

  return undefined;
}

function buildFolderSubpath(rawValue?: string) {
  if (!rawValue) {
    return undefined;
  }

  const sanitized = rawValue
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_");

  return sanitized.length > 0 ? sanitized : undefined;
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
