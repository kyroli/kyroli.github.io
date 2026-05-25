# Kilonova

A personal browser startpage.

## 🛠️ Design & Tech Choices

- **Modern Browsers Only**: Built with modern Web standards (ESNext). No polyfills or legacy browser support.
- **Tech Stack**: Svelte 5 (Runes) + Vite 6 + Tailwind CSS v4.
- **Tooling**: Strict linting and formatting enforced by Biome.

## ⚙️ Features

- **Data Sync**: Syncs data to a private GitHub repository using a Fine-grained PAT.
- **Drag & Drop**: Reorder groups and links.
- **Data Location**: Stored in LocalStorage or your own GitHub repository.

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
# 1. Install dependencies (requires pnpm)
pnpm install

# 2. Start the dev server
pnpm dev

# 3. Format & Check
pnpm format
pnpm lint
```

*Note: CI/CD via GitHub Actions requires passing Biome lint and check before deployment.*