# Kilonova

[简体中文](./README_zh.md) | English

A personal browser startpage and bookmark manager.

## Tech Choices

- **Tech Stack**: Svelte 5 + Vite 8 + Tailwind CSS v4 + TypeScript 6.
- **Modern Browsers Only**: ESNext standards with zero legacy polyfills.
- **Tooling**: Code formatting and linting enforced by Biome.

## Features

- **Drag & Drop**: Reorder bookmark groups and site links.
- **Local Storage**: Save data in the browser locally with auto-sync across tabs.
- **Cloud Sync**: Sync configurations and layouts to a dedicated GitHub repository.
- **Theme**: Support dark and light modes.
- **Responsive Catalog**: Interactive, scroll-active vertical sidebar for desktop and auto-centering horizontal scroll tabs for mobile layouts.

## Data Storage & Sync

- **Local Storage (LocalStorage)**: All bookmarks, preferences, and themes are saved locally and synced across open tabs.
- **GitHub Sync**: Sync data using a locally-stored Fine-grained Personal Access Token (PAT) to a dedicated repository (Gists are avoided as Secret Gist URLs can be publicly accessed if leaked).
  * ⚠️ **Security Tip**: Use a **Fine-grained PAT** and only grant read & write access to the repository storing your bookmarks (Contents: Read & Write).
- **Conflict Handling**: Compares version signatures (SHA) and prompts to resolve conflicts via **Force Push** or **Reset to Remote**.
- **Offline Backup**: Export and import layouts as a standard JSON file.

## Project Structure

The codebase separates UI components from core business logic:

```text
src/
├── assets/              # Static assets (images, icons)
├── components/          # Component Layer (UI)
│   ├── business/        # Stateful business-specific components
│   ├── modals/          # Configuration dialogs and settings modals
│   └── ui/              # Reusable, stateless primitives
├── lib/                 # Core Logical Layer
│   ├── actions/         # Svelte actions (e.g., drag-and-drop directives)
│   ├── config/          # Global configs
│   ├── core/            # Reactive global state stores (Svelte Runes)
│   ├── infra/           # Infrastructure adapters (GitHub client, LocalStorage adapter)
│   ├── services/        # Service managers (sync orchestrator, data layer manager)
│   ├── types.ts         # Global TypeScript definitions
│   └── utils.ts         # Generic utilities (e.g., cn, icon resolution)
├── App.svelte           # Root application component
├── app.css              # Global styling entrypoint
└── main.ts              # Application bootstrap entrypoint
```

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start dev server
pnpm dev

# 3. Format & Lint
pnpm format
pnpm lint
pnpm check
```

*Note: Pushing code that fails Biome lint/format checks will cause the CI/CD build pipeline to fail.*