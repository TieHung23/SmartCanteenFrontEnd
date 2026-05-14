@AGENTS.md

# Additional Context for Claude / Antigravity

## Quick Reference

- Run dev server: `npm run dev`
- Run linter: `npm run lint`
- Format code: `npm run format`
- Build: `npm run build`

## Key Dependencies

- `next@16`, `react@19`, `tailwindcss@4`
- `shadcn/ui` with `components.json` config
- `axios` with interceptors in `lib/api/client.ts`
- `zustand` for client state (`lib/stores/`)
- `@tanstack/react-query` for server state
- `react-hook-form` + `zod` for forms
- `@t3-oss/env-nextjs` for env validation (`config/env.ts`)

## Architecture Decisions

- This is a **frontend-only** project. Backend API is external.
- Authentication tokens are stored in `localStorage` and auto-attached via Axios interceptor.
- All API calls go through `services/*.service.ts` → `lib/api/client.ts` → Backend.
- Environment variables are validated at build time via `config/env.ts`.

## When Generating Code

- Prefer Server Components by default. Add `"use client"` only when necessary.
- Use `cn()` from `@/lib/utils` for all conditional className logic.
- Use `ROUTES` from `@/config/routes` for navigation, never hardcode paths.
- Use `API_ENDPOINTS` from `@/lib/api/endpoints` for API URLs.
- Follow existing patterns in the codebase before introducing new ones.
