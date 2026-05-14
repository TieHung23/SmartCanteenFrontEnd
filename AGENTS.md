# Smart Canteen Frontend — Agent Guidelines

## Project Overview

- **Framework**: Next.js 16 with App Router (NOT Pages Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State**: Zustand (client state), React Query (server state)
- **API**: Axios instance at `lib/api/client.ts` with auto-attached Bearer token
- **Forms**: React Hook Form + Zod validation

## Critical Rules

1. **NEVER** use Pages Router patterns (`getServerSideProps`, `getStaticProps`). Use App Router only.
2. **NEVER** call `process.env` directly. Always import from `@/config/env`.
3. **NEVER** call API endpoints with raw strings. Always use `@/lib/api/endpoints`.
4. **NEVER** put reusable components inside `app/`. Put them in `components/`.
5. **ALWAYS** use the `cn()` utility from `@/lib/utils` for conditional classNames.
6. **ALWAYS** use `"use client"` directive for components that use hooks, event handlers, or browser APIs.

## File Organization

- `app/` — Only routing files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- `components/ui/` — shadcn/ui primitives (Button, Input, Card...)
- `components/features/<feature>/` — Feature-specific components
- `components/layout/` — Header, Sidebar, Footer
- `services/*.service.ts` — API service layer (uses `apiClient` from `lib/api/client.ts`)
- `types/*.types.ts` — TypeScript interfaces per entity
- `lib/stores/*.ts` — Zustand stores
- `lib/hooks/*.ts` — Custom React hooks
- `config/routes.ts` — Frontend route constants
- `lib/api/endpoints.ts` — Backend API URL constants

## Import Aliases

```typescript
import { cn } from "@/lib/utils";
import { env } from "@/config/env";
import { ROUTES } from "@/config/routes";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
```

## Coding Style

- Use functional components with arrow functions
- Use `interface` for object shapes, `type` for unions/intersections
- File naming: `kebab-case.tsx` (e.g., `menu-card.tsx`)
- Component naming: `PascalCase` (e.g., `MenuCard`)
- Hook naming: `use-kebab-case.ts` (e.g., `use-auth.ts`)
