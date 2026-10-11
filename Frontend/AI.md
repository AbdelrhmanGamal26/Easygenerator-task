# AI usage (Frontend)

The frontend was built in a chat session with GitHub Copilot in VS Code (agent mode). I directed the work one feature at a time; the assistant wrote and edited the code and ran the build, lint and tests after each step.

## What was AI-assisted

- **Scaffold and structure:** Vite React + TypeScript setup, restructured to follow the folder layout and conventions of an earlier project (`@/` alias, JSDoc on components, lazy-loaded pages).
- **Backend integration:** an axios instance with `withCredentials` for the httpOnly session cookies, service functions, and an interceptor that refreshes the session once on a 401 (one shared refresh for concurrent requests) and logs out if that fails.
- **UI:** Tailwind v4, header/footer layout, profile page and avatar, no-layout-shift field errors, an application page with "Log out" and "Log out of all devices".
- **Forms:** zod schemas and react-hook-form with a single `FormInputField` component; the rules mirror the backend (email format, name of at least 3 characters, password of 8 to 72 characters with a letter, a number and a special character).
- **State and data:** Redux user slice, TanStack Query hooks, and a persisted profile (only name and email) in `localStorage`.
- **Feedback and resilience:** react-toastify toasts for server errors and an `ErrorBoundary`.
- **Security:** a Content-Security-Policy meta tag injected at build time, with `connect-src` limited to the backend origin.
- **Quality:** Vitest and Testing Library tests (validation, error helper, user slice, forms, protected routes, axios refresh interceptor), a CI workflow, and the README.

## What worked well

- Small, single-purpose requests ("show the server error in a toast", "add className to all components") with a build and lint run after each.
- Pointing at an existing project as the convention to copy.
- Giving the exact password and name rules from the task so the schema matched them directly.
- Moving from a token in `localStorage` to httpOnly cookies once the backend supported them, which removed the XSS exposure of the token.

## What I corrected or reworked

- **Token storage:** the first version kept a Bearer token in `localStorage` with a 401-logout interceptor. I replaced it with cookie sessions and a refresh-then-retry interceptor, and the persisted data is now only the displayed profile.
- **Undone edits:** when I undid some edits, files were deleted and the build broke; the assistant recreated them.
- **Over-split components:** the input was first split into a presentational field and a form wrapper; I asked for one merged file.
- **Styling overrides:** `className` props were added to every custom component, with `tailwind-merge` so caller classes override defaults instead of fighting CSS order.

## Review notes

- Generated tests run and pass, and the backend flow was smoke-tested with curl against a real MongoDB. There are no end-to-end browser tests.
- The CSP is only injected in production builds, so it is not exercised by `npm run dev`.
