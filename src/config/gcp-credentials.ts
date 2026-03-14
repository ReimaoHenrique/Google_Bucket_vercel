export type ServiceAccountCredentials = {
  project_id: string;
  client_email: string;
  private_key: string;
};

export function getGcpCredentials():
  | ServiceAccountCredentials
  | undefined {
  const rawJson =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    process.env.GCP_CREDENTIALS_JSON;

  if (rawJson) {
    return parseJson(rawJson, "GOOGLE_APPLICATION_CREDENTIALS_JSON/GCP_CREDENTIALS_JSON");
  }

  const base64Value = process.env.GCP_CREDENTIALS_BASE64;
  if (base64Value) {
    const decoded = decodeBase64(base64Value);
    return parseJson(decoded, "GCP_CREDENTIALS_BASE64");
  }

  return undefined;
}

function parseJson(raw: string, source: string) {
  try {
    return JSON.parse(raw) as ServiceAccountCredentials;
  } catch {
    throw new Error(`Credenciais invalidas em ${source}.`);
  }
}

function decodeBase64(value: string) {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    throw new Error("Falha ao decodificar GCP_CREDENTIALS_BASE64.");
  }
}
