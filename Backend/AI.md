# AI usage (Backend)

The backend was built in one long chat session with GitHub Copilot in VS Code (agent mode). I steered the work in small steps; the assistant wrote and edited the code and ran `npm run build`, `npm test`, `npm run test:e2e` and `npm run lint` after each change.

## What was AI-assisted

- **Scaffold:** NestJS 12 (ESM) with Vitest, Mongoose, Passport JWT, class-validator, Swagger, and a `docker-compose.yml` that runs only MongoDB.
- **Auth and users modules:** sign-up/sign-in DTOs with the task's field rules, `AuthService`, `JwtStrategy`, the protected `GET /users/me`, and duplicate email handling (409).
- **Sessions:** httpOnly access and refresh cookies, refresh-token rotation with only SHA-256 hashes stored, reuse detection, `signout` and `signout-all`.
- **Hardening:** bcrypt with a SHA-256 pre-hash, equalised sign-in timing, Helmet, CORS allow-list, throttling, an `Origin`-based CSRF guard, env validation (including rejecting the placeholder secret in production), and `TRUST_PROXY` support.
- **Observability:** Pino logging with request ids and redaction, structured audit events, and a global exception filter.
- **Quality:** unit tests for services, strategy, controller, guards and config; HTTP tests with an in-memory users store; GitHub Actions CI; README and `INSTRUCTIONS.md` (the project conventions).

## Prompts and approaches that worked

- Giving the full task description first, then asking for the bonus items (logging, error handling, tests, CI, Swagger) in one go.
- Asking for a review of one area at a time ("review the auth module and simplify", "review against the NestJS instructions") instead of a vague "make it production grade".
- Pasting exact error output so the cause was diagnosed rather than guessed.
- Finishing with a manual smoke test against the real MongoDB (sign up, duplicate, weak password, wrong password, sign in, protected route, refresh, bad origin, sign out), because the HTTP tests use a fake users store.

## What I corrected or reworked

- **Docker:** the generated Dockerfile failed at `npm ci` (npm/Node mismatch with the lockfile), so the API is not containerised; only MongoDB runs in Docker. The compose file had also grown an API service, init script and healthcheck, and I cut it back to one service.
- **Over-engineering that I removed:** configurable JWT issuer and audience env vars (now fixed constants), a legacy raw-bcrypt hash path, and a `tokenVersion` mechanism for instant access-token revocation. The `tokenVersion` check added a user lookup on every request and a field to maintain for little gain over a 15-minute access token, so I removed it and accepted that already-issued access tokens live until they expire.
- **Refresh TTL:** I briefly changed the token lifetimes to seconds to test the refresh flow, then restored `15m` and `REFRESH_TOKEN_TTL_DAYS=7`.
- **Leftovers:** unused imports, stray files and verbose comments were cleaned up by hand; the user id was removed from API responses.

## Review notes

- The Copilot output was verified by build, lint, unit tests, HTTP tests and the manual smoke test above.
- Known limits: rate limiting is in memory (needs Redis for several instances), there is no account lockout, email verification or password reset, and the compose file uses the MongoDB root user.
