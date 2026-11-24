# Frontend folder structure

Canonical tree for `frontend/`. Match it when adding files. Source files are TypeScript.

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── .env.example
├── public/
└── src/
    ├── vite-env.d.ts
    ├── index.css
    ├── main.tsx
    ├── App.tsx
    ├── app/
    │   ├── queryClient.ts
    │   ├── store.ts
    │   ├── hooks.ts
    │   └── theme.ts
    ├── assets/
    ├── components/
    │   ├── ui/
    │   └── layout/
    │       └── AppShell.tsx
    ├── features/
    │   └── auth/
    │       ├── authApi.ts
    │       ├── authKeys.ts
    │       ├── useLogin.ts
    │       ├── components/
    │       │   └── LoginForm.tsx
    │       └── pages/
    │           └── LoginPage.tsx
    ├── hooks/
    ├── routes/
    │   └── AppRoutes.tsx
    ├── services/
    │   ├── api.ts
    │   └── token.ts
    └── utils/
```

`src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />
```

## Vite alias

`vite.config.ts`

```ts
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

`tsconfig.json` references the app and the Vite config. It does not compile files itself.

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json` paths (same `@` alias):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

`tsconfig.node.json` type-checks the Vite config:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

## Placement

- `components/ui/` — composites shared by two features. Ant Design supplies the controls. No Redux, no React Query, no HTTP.
- `components/layout/` — shell shared by pages, built with antd `Layout` and Tailwind.
- `features/<name>/` — API functions, query keys, query hooks, feature components, and pages. A slice only for shared client state.
- `app/` — the `QueryClient`, the antd `theme`, the single store, `RootState`, `AppDispatch`, and the typed Redux hooks.
- `index.css` — Tailwind theme and utilities. No preflight.
- `routes/` — the route table only.
- `services/` — the HTTP client used by feature API functions.
