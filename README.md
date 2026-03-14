# Vercel Serverless Google Bucket Upload

Microserviço **serverless** usando **Fastify** para upload de arquivos no **Google Cloud Storage (GCS)**, pronto para rodar com `vercel dev` localmente e para deploy direto na **Vercel**.

Este repositório funciona como **template inicial** para APIs que precisam enviar arquivos para um bucket do Google Cloud em ambiente serverless.

---

# Stack

* Node.js
* Fastify
* Google Cloud Storage SDK
* Vercel Serverless Functions

---

# O que este serviço faz

* Recebe **upload multipart** em `POST /upload`
* Recebe **upload base64** em `POST /upload-base64`
* Salva arquivos no bucket configurado em `GCS_BUCKET`
* Retorna metadados do arquivo enviado

Resposta típica:

```json
{
  "filename": "foto.jpg",
  "contentType": "image/jpeg",
  "size": 245133,
  "gcsUri": "gs://bucket/uploads/foto.jpg"
}
```

---

# Endpoints

## `GET /health`

Verifica se o serviço está ativo.

```bash
curl http://localhost:3000/health
```

---

## `POST /upload`

Upload via **multipart/form-data**

```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@/caminho/da/foto.jpg"
```

Campo esperado:

```
file
```

---

## `POST /upload-base64`

Upload via **JSON + base64**

```bash
curl -X POST http://localhost:3000/upload-base64 \
  -H "content-type: application/json" \
  -d '{
    "filename": "foto.jpg",
    "contentType": "image/jpeg",
    "data": "SEU_BASE64_AQUI"
  }'
```

---

# Variáveis de Ambiente

| Variável                              | Obrigatória | Descrição                     |
| ------------------------------------- | ----------- | ----------------------------- |
| `GCS_BUCKET`                          | sim         | Nome do bucket                |
| `GCS_UPLOAD_PREFIX`                   | não         | Prefixo de upload (`uploads`) |
| `MAX_FILE_SIZE_BYTES`                 | não         | Limite de tamanho do arquivo  |
| `GCS_PUBLIC`                          | não         | Define objeto como público    |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | não         | Credencial JSON               |
| `GCP_CREDENTIALS_JSON`                | não         | Credencial alternativa        |
| `GCP_CREDENTIALS_BASE64`              | não         | Credencial em base64          |

Se nenhuma credencial for definida, a SDK utiliza **Application Default Credentials (ADC)**.

---

# Rodar Localmente

```bash
npm install
npm run dev
```

O servidor será iniciado usando:

```
vercel dev
```

---

# Deploy na Vercel

```bash
npm install
vc deploy
```

---

# Segurança

* **Nunca versionar chaves privadas do GCP**
* Arquivos de service account devem estar no `.gitignore`
* Caso uma chave seja exposta, **revogue e gere uma nova no GCP imediatamente**

---

# Objetivo do Projeto

Este repositório existe para servir como **boilerplate reutilizável** para:

* APIs serverless
* Upload de arquivos
* Integração Vercel + Google Cloud Storage

---


