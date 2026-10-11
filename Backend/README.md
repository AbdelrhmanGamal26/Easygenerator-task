# Auth API (NestJS + MongoDB)

Sign up / sign in API with JWT authentication and one protected endpoint.

## Stack

NestJS 12 (ESM), MongoDB via Mongoose, Passport JWT, bcryptjs, class-validator, Pino logging, Swagger/OpenAPI, Vitest.

## Getting started

```bash
npm ci
cp .env.example .env     # set JWT_SECRET (min 32 chars) and MONGODB_URI
docker compose up -d     # starts MongoDB only
npm run start:dev
```

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/docs (disabled when `NODE_ENV=production`)

## Endpoints

| Method | Path                | Auth           | Description                                                                                                                                  |
| ------ | ------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/signup`      | no             | Register (`email`, `name` >= 3 chars, `password` >= 8 chars with letter, number, special char). Returns `{ user }`; does not start a session |
| POST   | `/auth/signin`      | no             | Sign in. Returns `{ user }` and sets the `access_token` and `refresh_token` httpOnly cookies                                                 |
| POST   | `/auth/refresh`     | refresh cookie | Rotates the refresh token and issues a new access token (returns `{ user }`)                                                                 |
| POST   | `/auth/signout-all` | refresh cookie | Revokes every refresh token of the user and clears both cookies (204)                                                                        |
| POST   | `/auth/signout`     | no             | Revokes the refresh token and clears both cookies (204)                                                                                      |
| GET    | `/users/me`         | Cookie JWT     | Current user (protected)                                                                                                                     |

The JWT lives in the `access_token` cookie (short-lived, default 15 minutes). A long-lived signed `refresh_token` cookie (default 7 days, scoped to `/auth`) is rotated on every refresh; only its SHA-256 hash is kept in the user's `refreshTokens` array and removed once the token is used, revoked or found expired (at most 10 live sessions per user). Replaying an already-used refresh token revokes all of the user's refresh tokens. Both cookies are `HttpOnly`, `SameSite=Lax` and `Secure` in production, so browser scripts cannot read them. Clients must send requests with credentials (`fetch`: `credentials: 'include'`, axios: `withCredentials: true`); the origin must be listed in `CORS_ORIGIN` (default `http://localhost:5173`). `Authorization: Bearer <token>` is still accepted for non-browser clients. Cross-site deployments need `COOKIE_SAME_SITE=none` (forces `Secure`); the `Origin` check described under Production notes is the CSRF protection.

Errors share one shape: `{ statusCode, message, error, requestId, path, timestamp }`.

## Configuration (env)

`MONGODB_URI`, `JWT_SECRET` (required); `PORT`, `JWT_EXPIRES_IN` (access token, default `15m`), `REFRESH_TOKEN_TTL_DAYS` (default `7`), `CORS_ORIGIN` (comma-separated), `TRUST_PROXY` (reverse-proxy hops, default `0`), `COOKIE_SAME_SITE` (`lax` default, `strict` or `none` for cross-site deployments; `none` forces `Secure`), `LOG_LEVEL`, `NODE_ENV`. Env is validated at startup.

## Scripts

| Command                                | Purpose                                    |
| -------------------------------------- | ------------------------------------------ |
| `npm run start:dev`                    | Dev server with watch                      |
| `npm run build` / `npm run start:prod` | Build / run compiled app                   |
| `npm test`                             | Unit tests                                 |
| `npm run test:e2e`                     | HTTP tests (in-memory users, no DB needed) |
| `npm run test:cov`                     | Coverage                                   |
| `npm run lint`                         | oxlint                                     |

## Production notes

- Single sign-out revokes only that refresh token; its access token stays valid until it expires (15 minutes by default). `signout-all` and refresh-token reuse revoke every refresh token of the user, but access tokens already issued stay valid until they expire.
- CSRF: every state-changing request must carry an `Origin` listed in `CORS_ORIGIN`; requests with auth cookies but no `Origin` get 403. Cookie-less non-browser clients are unaffected.
- Every response carries `X-Request-Id` (a well-formed incoming one is reused); it appears in all logs and in error bodies as `requestId`.
- Auth events are logged as structured `audit: true` entries (`signup`, `signin.success`, `signin.failure`, `refresh.success`, `refresh.reuse_detected` at warn level, `signout`, `signout_all`) with the user id when known. Passwords, tokens and emails are never logged.
- Rate limiting is per IP and in memory: set `trust proxy` behind a reverse proxy and use a shared store (e.g. Redis) when running several instances.
- The local compose file connects as the MongoDB root user; use a least-privilege user in production.

- Passwords (up to 72 characters) are SHA-256 pre-hashed, then hashed with bcrypt (12 rounds), so long and multi-byte passwords aren't truncated at bcrypt's 72-byte limit. Sign-in errors are generic and timing-equalised.
- Helmet, CORS allow-list, global rate limiting (stricter on `/auth/*`, 5/min on `/auth/signin`), whitelist validation.
- Structured JSON logs (Pino), `Authorization` header redacted.
- CI: `.github/workflows/ci.yml` runs lint, build and tests.
