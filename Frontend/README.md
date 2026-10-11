# Auth App - Frontend

React 19 + TypeScript (Vite) client for the NestJS auth API: sign up, login, a protected application page and a profile page.

## Stack

Vite, React Router, Redux Toolkit (session), TanStack Query + axios (API calls), react-hook-form + zod (forms and validation), Tailwind CSS v4, react-toastify, Vitest + Testing Library, Oxlint.

## Getting started

```bash
npm install
cp .env.example .env   # VITE_BACKEND_BASE_URL, the backend origin
npm run dev            # http://localhost:5173
```

The backend must run at `VITE_BACKEND_BASE_URL` (default `http://localhost:3000`) and list the frontend origin (`http://localhost:5173`) in its `CORS_ORIGIN`; requests are cross-origin and sent with credentials.

## Scripts

| Script                 | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the dev server                  |
| `npm run build`        | Type-check and build for production   |
| `npm run lint`         | Run Oxlint                            |
| `npm run format`       | Format `src` with Prettier            |
| `npm run format:check` | Check formatting                      |
| `npm test`             | Run the unit and component tests once |
| `npm run test:watch`   | Run the tests in watch mode           |

## Structure

```
src/
  @types/       shared TypeScript types
  components/   custom (app-specific) and shared (reusable) components
  constants/    storage key and backend resource names
  hooks/        react-query hooks and auth helpers
  layouts/      app, auth and protected-route layouts
  lib/          axios instance, zod schemas, helpers
  pages/        login, signup, application, profile, not found
  routes/       route tree (lazy-loaded pages)
  services/     axios calls to the backend
  store/        Redux user slice and session persistence
```

## Behaviour

- Signup validates the email format, a name of at least 3 characters and a password of at least 8 characters with a letter, a number and a special character. Errors show inline per field.
- Backend errors appear as toasts at the top of the screen.
- `/app` and `/profile` require a session; `/login` and `/signup` redirect signed-in users to `/app`.
- A 401 response triggers one session refresh; if that fails the user is logged out.

## Authentication and deployment

The session lives in httpOnly cookies set by the backend; only the user's name and email are kept in `localStorage` so the page can render before the session is revalidated.

- The backend should set `SameSite=Lax` (or `Strict`) and `Secure` on the cookies, since requests use `withCredentials`.
- `VITE_BACKEND_BASE_URL` must be the API origin in every environment, and the backend must allow the frontend's exact origin in `CORS_ORIGIN` (credentialed CORS; no wildcard). Keep the app and API on the same site so `SameSite=Lax` cookies are sent.
- `npm run build` injects a `Content-Security-Policy` meta tag. Also send `X-Frame-Options: DENY` (or `frame-ancestors 'none'`) from the host, as meta tags cannot set it.
