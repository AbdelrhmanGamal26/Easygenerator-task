# AI usage

I built this task with GitHub Copilot (agent mode in VS Code), one chat session for the backend and one for the frontend. I directed the work in small steps; the assistant wrote and edited the code and ran the build, lint and tests after each change. Per-project details are in [Backend/AI.md](Backend/AI.md) and [Frontend/AI.md](Frontend/AI.md); this file is the summary.

## Which parts were AI-assisted

- **Backend (NestJS 12, MongoDB, Mongoose):** scaffold, auth and users modules, DTO validation, JWT cookie sessions with refresh-token rotation and reuse detection, hardening (bcrypt with a SHA-256 pre-hash, Helmet, CORS allow-list, throttling, an `Origin`-based CSRF guard, env validation), Pino logging with request ids and audit events, a global exception filter, Swagger, unit and HTTP tests, and the MongoDB `docker-compose.yml`.
- **Frontend (React 19, TypeScript, Vite):** scaffold and folder structure, sign-up, sign-in, application and profile pages, zod and react-hook-form validation that mirrors the backend rules, an axios instance with a refresh-then-retry interceptor, Redux and TanStack Query state, Tailwind styling, toasts, an error boundary, a Content-Security-Policy, and Vitest tests.
- **Repository:** one GitHub Actions workflow with a backend and a frontend job, and the READMEs.

## Prompts and approaches that worked

- Giving the full task description first, then asking for the bonus items (logging, error handling, tests, CI, API docs) together.
- Small, single-purpose follow-ups with a build and lint run after each ("show the server error in a toast", "remove the id from the response").
- Pointing at an earlier project as the convention to copy for the frontend structure.
- Reviewing one area at a time ("review the auth module and simplify") instead of asking for "production grade" in general.
- Pasting exact error output so the cause was diagnosed rather than guessed.
- Ending with a manual smoke test against the real MongoDB, since the HTTP tests use a fake users store.

## What I corrected, reworked or decided differently

- **Token storage:** the first frontend version kept a Bearer token in `localStorage`. I switched to httpOnly cookies with refresh-token rotation, so scripts can no longer read the token; the browser only keeps the displayed name and email.
- **Over-engineering removed:** configurable JWT issuer and audience env vars, a legacy raw-bcrypt hash path, and a `tokenVersion` mechanism for instant access-token revocation. I accepted that already-issued 15-minute access tokens stay valid until they expire rather than add a database lookup to every request.
- **Docker:** the generated Dockerfile failed at `npm ci`, so only MongoDB runs in Docker, and the compose file was cut back from an API service with an init script and healthcheck to a single service.
- **Frontend structure:** the input was split into two components and I asked for one merged file; `className` props were added to every custom component with `tailwind-merge` so callers can override styles.
- **Naming and API shape:** the password field is `password` (it holds the hash), and the user id is not returned in API responses.
- **Token lifetimes:** I shortened them to seconds to test the refresh flow, then restored `15m` and 7 days.
- **Repository layout:** the CI workflows were generated per project; I moved them into one workflow at the repo root, because GitHub only runs workflows from there.

## How I verified the output

- Build, lint, backend unit and HTTP tests, and frontend component tests all pass.
- A curl smoke test against the real MongoDB covered sign up, duplicate email, weak password, wrong password, sign in, the protected route, refresh, a disallowed origin and sign out.
- There are no end-to-end browser tests.

## Known limits

- Rate limiting is in memory (a shared store such as Redis is needed for several instances).
- No account lockout, email verification, password reset or roles.
- The local compose file uses the MongoDB root user; production needs a least-privilege user.
- The frontend CSP is only injected in production builds.
