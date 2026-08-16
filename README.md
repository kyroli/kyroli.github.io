# Kilonova

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Biome](https://img.shields.io/badge/Linted_by-Biome-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev/)

[简体中文](./README_zh.md) | English

A personal browser startpage and bookmark manager.

## Tech Choices

- **Tech Stack**: Svelte 5 (Runes) + Vite 8 + Tailwind CSS v4 + TypeScript 7.
- **Modern Browsers Only**: Target ESNext standards without legacy polyfills.
- **Architecture**: Zero-backend static client communicating directly with browser APIs and GitHub REST API.
- **Tooling**: Code formatting and linting enforced by Biome.

## Features

- **Search**: Multi-engine search supporting Bing, Google, DuckDuckGo, and Yandex. Quick focus via `/` or `Ctrl/Cmd + K`, and blur via `Escape`.
- **Drag & Drop**: Reorder bookmark groups and site links in Edit Mode, featuring FLIP animations and edge scroll detection.
- **Card Micro-interactions**: Pointer-driven 3D perspective tilt and surface shine on site cards.
- **Responsive Navigation**: Desktop scroll-spy vertical sidebar and mobile sticky horizontal tabs with auto-centering.
- **Theme Support**: Dark and light themes with system color-scheme detection and View Transitions.
- **Localization**: Automatic interface localization for English and Simplified Chinese based on browser language settings.
- **Local Storage**: Data persistence via LocalStorage with cross-tab synchronization.
- **GitHub Sync**: Remote synchronization via GitHub REST API with SHA-based conflict detection.
- **Backup**: Export and restore bookmark data as standard JSON files.

## Data Storage & Sync

- **Local Storage**: Bookmark structures, custom preferences, and theme choices are stored locally in the browser and synchronized across tabs via the Storage API.
- **GitHub Sync**: Synchronizes configuration directly to a user-designated GitHub repository using a locally stored Fine-grained Personal Access Token (PAT).
  * ⚠️ **Security**: Use a **Fine-grained PAT** with permissions restricted strictly to the designated repository (`Contents: Read and write`).
- **Conflict Resolution**: Verifies file commit SHAs before writes. Prompts to resolve conflicts via **Force Push** (overwrite remote) or **Reset to Remote** (overwrite local).
- **Data Export/Import**: Provides JSON serialization for offline backups and migration.

## Project Structure

```text
src/
├── assets/              # Static assets (images, icons)
├── components/          # Component Layer (UI)
│   ├── business/        # Stateful business-specific components
│   ├── modals/          # Configuration dialogs and settings modals
│   └── ui/              # Reusable, stateless primitives
├── lib/                 # Core Logical Layer
│   ├── actions/         # Svelte actions (e.g., drag-and-drop, tilt, tooltip)
│   ├── config/          # Preset configs (search engines, defaults)
│   ├── core/            # Reactive global state stores (Svelte Runes)
│   ├── infra/           # Infrastructure adapters (GitHub client, LocalStorage adapter)
│   ├── services/        # Service managers (sync orchestrator, data layer manager)
│   ├── types.ts         # Global TypeScript definitions
│   └── utils.ts         # Generic utilities
├── App.svelte           # Root application component
├── app.css              # Global styling entrypoint
└── main.ts              # Application bootstrap entrypoint
```

## Getting Started

### Prerequisites
- Node.js >= 22.0.0
- pnpm >= 10.0.0

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start dev server
pnpm dev

# 3. Build for production
pnpm build

# 4. Format & Lint
pnpm format
pnpm lint
pnpm check
```

*Note: Pushing code that fails Biome lint/format checks will cause the CI/CD build pipeline to fail.*

## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0).