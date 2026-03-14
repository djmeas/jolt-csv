# Jolt CSV

A CSV parser and viewer webapp. Paste or upload CSV files, view them in a sortable table, and filter rows with flexible conditions.

## Features

- **Paste or upload** – Paste CSV text or drag-and-drop `.csv` / `.txt` files
- **Table view** – Sticky headers, horizontal/vertical scroll for large datasets
- **Filtering** – Match ALL or ANY conditions across columns (equals, contains, starts with, ends with, not equals, is empty, is not empty)

## Tech stack

- **Nuxt 4** – Vue 3, file-based routing
- **Tailwind CSS** – Styling
- **PapaParse** – CSV parsing

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and go to the CSV viewer.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Project structure

```
app/
├── pages/
│   ├── index.vue   # Landing page
│   └── csv.vue     # CSV parser/viewer
└── composables/
    └── useCsvParser.ts   # PapaParse-based CSV parsing
```

See [AGENTS.md](./AGENTS.md) for full documentation.
