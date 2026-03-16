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
* Opcionalmente cria uma subpasta por placa (informada via campo `placa`) antes de salvar o arquivo
* Retorna metadados do arquivo enviado

Resposta típica:

```json
{
  "ok": true,
  "bucket": "meu-bucket",
  "objectName": "uploads/ABC1D23/2026-03-14/uuid-foto.jpg",
  "contentType": "image/jpeg",
  "size": 245133,
  "gcsUri": "gs://meu-bucket/uploads/ABC1D23/2026-03-14/uuid-foto.jpg",
  "publicUrl": "https://storage.googleapis.com/meu-bucket/uploads/ABC1D23/2026-03-14/uuid-foto.jpg"
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
  -F "placa=ABC1D23" \
  -F "file=@/caminho/da/foto.jpg"
```

Campo esperado:

```
file
```

Campo opcional:

```
placa (query string ou campo do formulário)
```

Quando informado, o valor de `placa` é sanitizado (`A-Z`, `0-9`, `.`, `_`, `-`) e usado para criar uma subpasta extra antes do arquivo dentro do bucket (`<prefix>/<placa>/<data>/<uuid>-arquivo.ext`). Se não for enviado, o arquivo vai direto para o prefixo padrão.

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

## `DELETE /bucket/folder`

Remove todos os objetos com um determinado prefixo (simulando a exclusao de uma pasta) no bucket configurado.

```bash
curl -X DELETE http://localhost:3000/bucket/folder \
  -H "content-type: application/json" \
  -d '{"folderPath": "uploads/2024-03-14"}'
```

Campos aceitos no corpo ou query string:

| Campo        | Obrigatorio | Descricao                                 |
| ------------ | ----------- | ----------------------------------------- |
| `folderPath` | sim*        | Prefixo/pasta relativa dentro do bucket   |
| `prefix`     | opcional    | Alias para `folderPath`, aceita o mesmo   |

> \* Informe pelo menos um dos campos.

Retorna `404` caso nenhum objeto seja encontrado para o prefixo informado.

---

# Variáveis de Ambiente

| Variável                              | Obrigatória | Descrição                     |
| ------------------------------------- | ----------- | ----------------------------- |
| `GCS_BUCKET`                          | sim         | Nome do bucket                |
| `GCS_UPLOAD_PREFIX`                   | não         | Prefixo de upload (`uploads` se vazio) |
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
ão mostrados recursos de todos os projetos.
saas_ofcina/uploads/2026-03-14/ 
