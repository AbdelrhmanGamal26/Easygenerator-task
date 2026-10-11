# Auth App

Sign up / sign in module: a NestJS + MongoDB API and a React + TypeScript client.

| Project              | Stack                                                          | Docs                                     |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| [Backend](Backend)   | NestJS, MongoDB (Mongoose), JWT in httpOnly cookies, Swagger   | [Backend/README.md](Backend/README.md)   |
| [Frontend](Frontend) | React 19, Vite, TypeScript, Redux Toolkit, TanStack Query, zod | [Frontend/README.md](Frontend/README.md) |

## Quick start

Requires Node 24 and Docker (for MongoDB).

```bash
# 1. Backend: http://localhost:3000 (Swagger at /docs)
cd Backend
npm ci
cp .env.example .env        # set JWT_SECRET (min 32 chars)
docker compose up -d        # MongoDB only
npm run start:dev

# 2. Frontend: http://localhost:5173
cd ../Frontend
npm ci
cp .env.example .env
npm run dev
```

The backend only accepts requests from the origin in its `CORS_ORIGIN` (default `http://localhost:5173`), so keep the frontend on that port.

## Tests

Run `npm test` in either folder; the backend also has `npm run test:e2e`. GitHub Actions runs lint, build and tests for both projects ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## AI usage

See [AI.md](AI.md).
