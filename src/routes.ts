import type { FastifyInstance } from "fastify";

import { registerHealthRoute } from "./routes/health.js";
import { registerBase64UploadRoute } from "./routes/upload-base64.js";
import { registerMultipartUploadRoute } from "./routes/upload-multipart.js";
import { registerDeleteFolderRoute } from "./routes/delete-folder.js";

export function registerRoutes(app: FastifyInstance) {
  registerHealthRoute(app);
  registerMultipartUploadRoute(app);
  registerBase64UploadRoute(app);
  registerDeleteFolderRoute(app);
}
