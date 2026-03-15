# Jolt Sheets

A CSV and Excel viewer webapp. Paste or upload CSV or `.xlsx` files, view them in a sortable table, filter and edit rows, and export back to CSV or Excel.

## Features

- **Paste or upload** – Paste CSV text, or drag-and-drop `.csv`, `.txt`, or `.xlsx` files
- **Excel support** – Upload `.xlsx` files; single-sheet workbooks load directly. Multi-sheet workbooks open a sheet picker so you choose which sheet to view and edit
- **Table view** – Sticky headers, virtualized scrolling for large datasets, optional cell borders
- **Sorting** – Click a column header to sort (asc → desc → clear)
- **Filtering** – Match ALL or ANY conditions across columns (equals, contains, starts with, ends with, not equals, is empty, is not empty)
- **Edit mode** – Toggle edit mode to change header labels and cell values inline
- **Export** – Export as CSV or XLSX (matches the format you loaded). When filters are active, choose to export all rows or only filtered rows

## Tech stack

- **Nuxt 4** – Vue 3, file-based routing
- **Tailwind CSS** – Styling
- **PapaParse** – CSV parsing
- **SheetJS (xlsx)** – Excel read/write
- **@tanstack/vue-virtual** – Virtualized table rows

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and go to the CSV & Excel viewer.

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
│   └── csv.vue     # CSV & Excel viewer (filter, sort, edit, export)
└── composables/
    ├── useCsvParser.ts   # PapaParse-based CSV parsing
    └── useXlsxParser.ts  # SheetJS-based Excel read/write, sheet picker
```

See [AGENTS.md](./AGENTS.md) for full documentation.
