---
name: frontend
description: >-
  Builds and changes the Vite + React + TypeScript frontend with Ant Design,
  Tailwind CSS, Redux Toolkit for client state, TanStack React Query for
  server state, and feature folders. Mobile responsive layout is the first
  preference. Use when working in frontend/, or when the user mentions Vite,
  React, TypeScript, Ant Design, antd, Tailwind, mobile, responsive, Redux,
  Redux Toolkit, React Query, TanStack Query, slices, the store, queries,
  mutations, access tokens, reusable components, or UI components.
---

# Frontend

All frontend code lives in `frontend/`. Use Vite, React function components, and TypeScript. React Query owns server state. Redux Toolkit owns client state. Keep reusable UI free of both.

## Mobile first

Mobile responsive is the first preference. Write the narrow layout, then add wider breakpoints.

- Unprefixed Tailwind classes are the phone layout. Add `sm:`, `md:`, and `lg:` only to expand it. Do not start from a desktop row and hide the overflow.
- A changed screen stays usable at 320px wide: no horizontal page scroll, text that fits, and controls with a tappable size. Stack title and actions.
- A shared list uses cards below the `md` breakpoint and a table from `md` up. Search, sorting, and pagination stay on both. Do not make a phone user scroll a table sideways.
- The app shell collapses the side navigation on a small screen. Page padding tightens (`p-4`, then `md:p-6`).
- Check the changed screen at a phone width and a desktop width before finishing a layout change.

## Stack

- Vite with `@vitejs/plugin-react`
- TypeScript in `strict` mode
- React function components (`.tsx`, no class components)
- `@tanstack/react-query` for every API read and write (`useQuery`, `useMutation`)
- Redux Toolkit (`configureStore`, `createSlice`) for client-only state
- `react-redux` only through `src/app/hooks.ts`
- React Router for pages
- Ant Design (`antd`) for controls
- Tailwind CSS for layout and spacing

Do not add `.js` or `.jsx` source files under `src/`. Do not add `createAsyncThunk`, RTK Query, SWR, CSS Modules, styled-components, Emotion, or another server-state library. Ant Design keeps its own CSS-in-JS behind `StyleProvider`.

## TypeScript

- Components are `.tsx`. Modules without JSX are `.ts`.
- Type every component's props. Export the props type when another file needs it.
- Use `import type` for type-only imports.
- No `any`. Use a named type, or `unknown` plus a narrowing check.
- Do not silence errors with `@ts-ignore` or `as` casts that throw away a real mismatch.
- `src/vite-env.d.ts` contains `/// <reference types="vite/client" />` so `import.meta.env` is typed.
- `tsconfig.app.json` sets `strict`, `jsx: react-jsx`, and paths `"@/*": ["./src/*"]`. `tsconfig.node.json` type-checks `vite.config.ts`. `tsconfig.json` only holds project references to those two files.
- The JSON result in `services/api.ts` is the one allowed type assertion. The network payload is untyped until that boundary.

## Folder structure

```
frontend/
├── index.html
├── package.json
├── tsconfig.json              # references tsconfig.app.json and tsconfig.node.json
├── tsconfig.app.json
├── tsconfig.node.json         # includes vite.config.ts
├── vite.config.ts
├── .env.example               # VITE_API_URL only
├── public/
└── src/
    ├── vite-env.d.ts
    ├── index.css                # Tailwind layers, no preflight
    ├── main.tsx                 # providers, then <App />
    ├── App.tsx
    ├── app/
    │   ├── queryClient.ts       # one QueryClient
    │   ├── store.ts             # configureStore, RootState, AppDispatch
    │   ├── hooks.ts             # typed useAppDispatch, useAppSelector
    │   └── theme.ts             # antd ThemeConfig
    ├── assets/
    ├── components/
    │   ├── ui/                  # composites shared by two features
    │   └── layout/              # antd Layout shell + Tailwind placement
    ├── features/
    │   └── <feature>/
    │       ├── <feature>Api.ts  # calls services/api.ts
    │       ├── <feature>Keys.ts # query key factory
    │       ├── <feature>Slice.ts # only when the feature has client state
    │       ├── components/      # used only by this feature
    │       └── pages/           # route screens for this feature
    ├── hooks/                   # shared hooks that are not Redux
    ├── routes/
    │   └── AppRoutes.tsx
    ├── services/
    │   └── api.ts               # fetch/axios base client
    └── utils/
```

| Put it here | When |
|---|---|
| `components/ui/<Name>/` | A composite shared by two features. Ant Design already supplies Button, Input, Modal, Table |
| `components/layout/` | App chrome shared by pages, built from antd `Layout` |
| `features/<feature>/` | State, pages, and components for one domain |
| `hooks/` | Shared non-Redux logic |
| `services/api.ts` | HTTP client only. Feature `*Api.ts` files call it. Components do not |
| `routes/AppRoutes.tsx` | Route table. Pages stay in the feature that owns them |

Name components in PascalCase, slices and utilities in camelCase. One component per folder under `components/ui/`.

## Import alias

`vite.config.ts` and `tsconfig.app.json` both alias `@` to `src`. Import with `@/app/theme`, `@/app/queryClient`, `@/features/auth/useLogin`. Do not use deep relative paths (`../../../`).

Environment variables are `import.meta.env.VITE_*` only. Put `VITE_API_URL` in `.env.example`. `VITE_` values ship to the browser, so they hold public config, not secrets.

## Ant Design and Tailwind

Use both. Ant Design draws the controls. Tailwind places them.

- Reach for `antd` before writing a control: `Button`, `Input`, `Form`, `Select`, `Table`, `Modal`, `DatePicker`, `Layout`, `Menu`, `Typography`, `Alert`, `Spin`, `Empty`.
- Use Tailwind utilities for layout and spacing (`flex`, `flex-col`, `gap-4`, `p-4`, `md:flex-row`, `md:p-6`, `max-w-sm`). Put those classes on the page or the antd `className`. Unprefixed utilities are the mobile layout.
- Colors, radius, and density live in `src/app/theme.ts` as an antd `ThemeConfig`. `ConfigProvider` applies that theme.
- Do not restyle `.ant-*` classes. Do not rebuild an antd prop (`type`, `size`, `danger`) as a second component API.
- Add a file under `components/ui/` only when two features share a composite antd does not ship. Do not wrap one antd component just to rename it.
- A `components/ui/` composite is presentational: props in, callbacks out. No store, no `useQuery`, no `useMutation`, no `import.meta.env`.
- Feature-only composites stay in `features/<feature>/components/`.

Tailwind must not reset Ant Design:

- `vite.config.ts` registers `@tailwindcss/vite` after the React plugin.
- `src/index.css` loads Tailwind `theme` and `utilities` only. Do not import preflight.
- Declare `@layer theme, base, antd, components, utilities`.
- `StyleProvider` from `@ant-design/cssinjs` sets `layer` so antd styles sit in the `antd` layer. Tailwind utilities can then win on a `className` you pass.

`main.tsx` imports `src/index.css`.

Local state (`useState`) is for state one component owns: open/closed, input draft, hover. Shared client state goes in a slice. Server state goes in React Query.

## React Query

Server data uses `@tanstack/react-query`. One `QueryClient` lives in `src/app/queryClient.ts`.

- Reads use `useQuery`. Writes use `useMutation`. Define those hooks in the feature folder.
- Query functions call `<feature>Api.ts`. That file calls `services/api.ts`. Components call the hooks, not `api`.
- Each feature has a key factory, `<feature>Keys.ts`. Keys are `as const` tuples. A list and its detail share one prefix.
- Pass the response type through `api.get<T>` / `api.post<T>`. Do not type the cache with `any`.
- After a mutation changes server data, `invalidateQueries` with that feature's key prefix, or `setQueryData` when the response is the new cache value.
- Do not copy query data into a slice.

Defaults on the shared client: `retry: 1`, `refetchOnWindowFocus: false`. Override them per query only when that screen needs a different policy.

## Redux Toolkit

- One store in `src/app/store.ts`. Register each slice reducer there.
- Export `RootState` and `AppDispatch` from the store file.
- `useAppDispatch` and `useAppSelector` in `src/app/hooks.ts` are bound to those types. Feature code uses those hooks, not the untyped `react-redux` hooks.
- Add `<feature>Slice.ts` only for client state shared across components in that feature.
- Give each slice an exported state type. Selectors take `RootState` via `import type`.
- State must be serializable. Do not store functions, component instances, promises, or API payloads.
- Reducers own the state changes. Components dispatch actions; they do not reshape slice state inline.
- Export selectors from the slice file next to the reducer.

Skip Redux for state that no other component reads.

## App entry

`src/main.tsx` mounts one tree: `StrictMode`, `QueryClientProvider`, `Provider`, `StyleProvider`, `ConfigProvider`, `BrowserRouter`, then `App`. `App` renders `AppRoutes` and nothing else. Throw if `#root` is missing. See [examples.md](examples.md).

## API client

`src/services/api.ts` is the only module that calls `fetch`.

- Base URL is `import.meta.env.VITE_API_URL`.
- Export `api.get<T>`, `api.post<T>`, and `api.patch<T>`.
- A non-OK response throws `ApiError`. Read the JSON body: a string `detail` is the message; an array `detail` uses the first `msg`. Fall back to `statusText`.
- Login stores `access_token` in `sessionStorage` under `access_token`. The client sends `Authorization: Bearer <token>` when that key is set. Logout removes the key. Do not put the token in Redux or the query cache.
- UI components do not import `api`.

## Signed-in routes

A successful login navigates to `/dashboard`. A route that needs a user redirects to `/login` when no access token is stored. `/login` redirects to `/dashboard` when a token is already stored.

## Request status in the UI

A screen that loads or submits server data renders every query or mutation state:

| Flag | Render |
|---|---|
| `isPending` | antd `Spin`, or `Button` `loading` |
| `isError` | antd `Alert` with `error.message` |
| `isSuccess` with no rows | antd `Empty` |
| `isSuccess` with data | The content |

Do not leave the idle screen in place while a request is pending or has failed.

## Add a feature

1. Create `src/features/<feature>/`.
2. Add `<feature>Api.ts` and `<feature>Keys.ts`.
3. Add a `useQuery` or `useMutation` hook that calls the API function.
4. Add `<feature>Slice.ts` and register it in `src/app/store.ts` only when the feature has shared client state.
5. Add pages under `features/<feature>/pages/` and a route in `src/routes/AppRoutes.tsx`.
6. Build the page from antd controls and a mobile-first Tailwind layout. Add a feature component only when the UI is specific to this domain.
7. Keep the page thin: call query hooks, render their status and data.

## Examples

See [examples.md](examples.md) for the app entry, Tailwind layers, API client, query client, a login mutation, and an antd form that renders pending and error.

See [folder-structure.md](folder-structure.md) for the full tree, the Vite alias, Tailwind, and the TypeScript project references.
