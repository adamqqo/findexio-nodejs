# Findexio Web (Railway)

Node.js frontend for **Findexio**. Reads financial health outputs from PostgreSQL schema `core.*` (populated by the Python ETL service).

## Local run

```bash
npm ci
cp .env.example .env
npm run dev
```

## Railway deploy

1. Create a new Railway project from this repo.
2. Add/attach the same PostgreSQL instance used by the Python ETL (or copy `DATABASE_URL`).
3. Ensure env var `DATABASE_URL` is present.
4. Deploy.

Healthcheck endpoint: `/api/health`

## Pages

- `/` search by name or IČO
- `/company/[ico]` company detail (latest grade + features + grade history)
