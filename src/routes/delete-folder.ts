import type { FastifyInstance } from "fastify";

import { config } from "../config/index.js";
import { deleteFolderFromBucket } from "../services/delete-folder-from-bucket.js";

type DeleteFolderPayload = {
  folderPath?: string;
  prefix?: string;
};

export function registerDeleteFolderRoute(app: FastifyInstance) {
  app.delete("/bucket/folder", async (request, reply) => {
    if (!config.gcsBucket) {
      return reply.status(500).send({
        ok: false,
        error: "GCS_BUCKET nao configurado.",
      });
    }

    const payload = (request.body ?? {}) as DeleteFolderPayload;
    const query = (request.query ?? {}) as DeleteFolderPayload;
    const folderPath =
      payload.folderPath ??
      payload.prefix ??
      query.folderPath ??
      query.prefix;

    if (!folderPath) {
      return reply.status(400).send({
        ok: false,
        error: 'Informe o campo "folderPath" (ou "prefix") apontando para a pasta a ser removida.',
      });
    }

    try {
      const result = await deleteFolderFromBucket(folderPath);

      if (result.deleted === 0) {
        return reply.status(404).send({
          ok: false,
          error: "Nenhum objeto encontrado com o prefixo informado.",
          bucket: config.gcsBucket,
          prefix: result.prefix,
        });
      }

      return reply.status(200).send({
        ok: true,
        bucket: config.gcsBucket,
        prefix: result.prefix,
        deletedObjects: result.deleted,
      });
    } catch (error) {
      request.log.error({ err: error }, "Falha ao remover prefixo do bucket.");
      return reply.status(500).send({
        ok: false,
        error:
          "Falha ao remover arquivos do bucket. Verifique se o prefixo existe e se a credencial tem permissao.",
      });
    }
  });
}
