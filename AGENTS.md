# Repository Guidelines

## Project Structure & Module Organization
- `src/app` hosts Next.js routes and API handlers.
- `src/components` bundles reusable client components.
- `src/lib` centralizes server helpers (auth, OpenAI, S3); `src/utils` and `src/types` keep pure helpers and TypeScript contracts.
- Tests sit beside features in `__tests__` folders with fixtures and mocks.
- Static assets live in `public/`, reference data in `data/`, and deployment helpers in `scripts/`.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server on http://localhost:3000 with hot reload.
- `npm run build` compiles the production bundle; run before staging or container builds.
- `npm run start` serves the compiled output; set env vars to mirror production.
- `npm run lint` runs ESLint (`next/core-web-vitals`, TypeScript) to guard style and quality.
- `npm test`, `npm run test:watch`, and `npm run test:coverage` drive Jest suites, watch mode, and coverage reports.

## Coding Style & Naming Conventions
- Use TypeScript, functional React components, and hooks; keep side-effects inside `useEffect` or server actions.
- Prefer two-space indentation, single quotes, and Tailwind utilities instead of bespoke CSS.
- Name files with kebab-case (`rating-component.tsx`) and keep tests/types near their sources.
- Export pages as default from `src/app`; favor named exports for shared utilities.
- Run `npm run lint` before opening a PR and resolve warnings locally.

## Testing Guidelines
- Jest with Testing Library covers components and routes; name specs `*.test.ts` or `*.test.tsx`.
- Mock network and storage calls with helpers in `src/lib` to keep suites deterministic.
- Cover critical flows: admin auth (`src/app/api/admin`), feedback capture, and S3 upload pathways.
- When adding a route, assert status codes and redirects with `next/navigation` mocks; snapshot only when props are stable.

## Commit & Pull Request Guidelines
- Follow short, imperative commit subjects as in history (e.g., `login process, no uploads`).
- Keep commits focused; add a body when updating schemas, env vars, or automated scripts.
- Pull requests should outline scope, list tests run (`npm run lint`, `npm test`), and call out env updates.
- Link tickets or issues and provide before/after visuals for UI changes.

## Environment & Security
- Store secrets in `.env.local`; required keys include `JWT_SECRET`, `TIMEWEB_*`, `OPENAI_API_KEY`, `HEYGEN_API_KEY`, and `ADMIN_PASSWORD`.
- Do not commit `.env*` files or production credentials; check that logs omit secrets before merging.
- Revisit guards in `src/middleware.ts` and admin API routes whenever exposing new endpoints to ensure `ADMIN_PASSWORD` validation remains intact.
