# Nuxt + SQLite + Tailwind Starter

A full-stack Nuxt 4 starter template for vibing and shipping. Clone it, tweak it, build something.

## Project Structure

```
├── app/
│   ├── app.vue           # App entry
│   ├── pages/            # File-based routes
│   │   ├── index.vue     # Public landing page
│   │   ├── dashboard.vue # Protected app (auth required)
│   │   ├── login.vue
│   │   └── register.vue
│   └── middleware/       # Route middleware (auth, guest)
├── server/
│   ├── api/auth/         # Auth API routes (login, register, logout)
│   ├── db/               # Drizzle schema and migrations
│   └── utils/            # Server utilities (db instance)
├── nuxt.config.ts
├── drizzle.config.ts
├── package.json
└── AGENTS.md
```

## Tech Stack

- **Framework**: Nuxt 4
- **Database**: SQLite + Drizzle ORM
- **Styling**: Tailwind CSS
- **Auth**: nuxt-auth-utils (encrypted cookie sessions)
- **UI**: Vue 3 (Composition API), TypeScript

## Quick Start

1. `npm install`
2. Copy `.env.example` to `.env` and set `NUXT_SESSION_PASSWORD` (32+ chars)
3. `npm run db:migrate` (first run)
4. `npm run dev`

## Build & Run Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply migrations to SQLite database |

## Authentication

- Users stored in SQLite via Drizzle ORM
- Session: `NUXT_SESSION_PASSWORD` in `.env` (32+ chars)
- Admin: `isAdmin` flag on users table; use `requireUserSession()` and check `user.isAdmin` for admin-only routes

## Coding Conventions

- **Vue**: Composition API with `<script setup>`
- **Components**: PascalCase filenames; auto-imported from `components/`
- **Composables**: Place in `composables/` for auto-import
- **Server**: `server/api/` for API routes, `server/utils/` for utilities
- **State**: Nuxt `useState` or Pinia
