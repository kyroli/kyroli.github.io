# Kilonova

A minimal, fast, and aesthetically pleasing personal startpage.

## 💡 Philosophy

- **Modernity First**: Rigorously built with the latest Web technology standards (ESNext).
- **Zero Legacy Burden**: Absolutely no consideration for legacy devices, old browsers, or polyfills. 

## ✨ Features

- **Blazing Fast**: Svelte 5 Runes + Vite 6 + Tailwind CSS v4.
- **Code Quality**: Formatted and linted strictly by Biome.
- **Cloud Sync**: Seamless data sync via GitHub (Fine-grained PATs) using GitHub Pages for static hosting.
- **Drag & Drop**: Intuitive reordering for groups and sites.
- **Privacy First**: Data stays in your browser or your private GitHub repository.

## 📂 Project Structure

```text
src/
├── components/          # Component Layer
│   ├── business/        # Business components (stateful, API logic)
│   ├── modals/          # Modals and dialogs
│   └── ui/              # Stateless, reusable base UI components
├── lib/                 # Logic & Data Layer
│   ├── actions/         # Svelte actions (e.g., dnd, popover)
│   ├── core/            # Global reactive states (Svelte 5 Runes)
│   ├── infra/           # Infrastructure (GitHub API, LocalStorage)
│   └── services/        # Business logic & cloud sync managers
├── utils/               # Utility functions (e.g., Tailwind merge)
├── App.svelte           # Root component
└── main.ts              # Application entry
```

## 🚀 Getting Started

```bash
# 1. Install dependencies (strictly use pnpm)
pnpm install

# 2. Start the dev server
pnpm dev

# 3. Format & Lint
pnpm format
pnpm lint
```

*Note: CI/CD via GitHub Actions requires passing `pnpm lint` and `pnpm check` before deployment.*