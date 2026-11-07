# CampusOps web client (frontend)

React 19 + TypeScript + Vite 7, Mantine 8 (UI, dates, charts, notifications), TanStack Query 5 (server state),
React Router 7, axios.

## Folder structure

```
src/
├── main.tsx                 entry point (CSS imports, providers, router)
├── app/                     providers, theme, React Query client, router (all routes + role guards)
├── config/env.ts            VITE_API_URL
├── api/                     axios client (JWT header, 401 handling), ApiError, Page<T>
├── auth/                    login page, AuthContext (useAuth), route guards, role groups
├── layout/                  application shell: header, role-filtered sidebar, notification bell
├── shared/                  reusable components (PageHeader, StatusBadge, QueryState …),
│                            enums mirrored from the API, formatting / label helpers
└── features/                one folder per business feature, mirroring the backend modules
    └── <feature>/
        ├── types.ts         TypeScript interfaces of the API responses / inputs
        ├── api.ts           query keys, API calls and React Query hooks
        ├── components/      feature components (tables, filters, modals, drawers)
        └── pages/           routed pages
```

Conventions:
- Components never call axios directly: they use the hooks from the feature's `api.ts`.
- Mutations invalidate the feature's query keys so every screen refreshes automatically.
- Which buttons are shown comes from the API (`availableActions`) or from role groups;
  the API is the real security boundary and enforces every rule again.
- Errors from the API are shown with `notify.error(error)` (uses the API's message).

## Adding a page

1. Create `features/<feature>/{types.ts, api.ts, components/, pages/}`.
2. Add the route in `src/app/router.tsx` (wrap it in `<RequireRole>` if needed).
3. Add a sidebar entry in `src/layout/navigation.tsx` with the allowed roles.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | development server on http://localhost:5173 |
| `npm run build` | type check + production build in `dist/` |
| `npm run preview` | serve the production build locally |
| `npm test` | unit tests (Vitest) |

Configuration: copy `.env.example` to `.env` and set `VITE_API_URL` (default `http://localhost:4000/api`).
