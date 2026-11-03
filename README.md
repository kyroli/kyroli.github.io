# Kilonova

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Biome](https://img.shields.io/badge/Biome-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev/)

[简体中文](./README_zh.md) | English

A minimal personal browser startpage and bookmark manager.

## Architecture & Standards

- **Core Stack**: Built with Svelte (Runes, Attachments, and reactive primitives), Tailwind CSS, TypeScript, and Vite with Lightning CSS.
- **Zero External UI Runtime**: Relies exclusively on framework primitives and native browser APIs without third-party UI component or state management libraries.
- **Native Web Platform**:
  - **Top Layer & Positioning**: Uses native `<dialog closedby="any">`, the Popover API (`popover`), and CSS Anchor Positioning (`anchor-name`, `position-anchor`, `position-area`) for modals, menus, tooltips, toasts, and drag ghosts.
  - **Modern CSS**: Uses `oklch()` color tokens paired with native `light-dark()` and `@starting-style` discrete transitions.
  - **ESNext & Web APIs**: Targets modern browsers using native `Uint8Array` Base64 encoding/decoding (`toBase64` / `fromBase64`), `URL.canParse`, and the File System Access API (`showSaveFilePicker`).
- **Unidirectional Layering**: Enforces strict separation across stateless UI primitives (`ui/`), business views and lazy-loaded modals (`business/`, `modals/`), domain services (`services/`), reactive state stores (`core/`), and infrastructure adapters (`infra/`).

## Features

- **Multi-Engine Search**: Switch between Bing, Google, DuckDuckGo, and Yandex. Focus the search bar with `/` or `Ctrl/Cmd + K`, and dismiss with `Escape`.
- **Pointer-Driven Drag & Drop**: Reorder groups and site shortcuts in Edit Mode via a custom pointer-event engine featuring collision detection, viewport edge auto-scrolling, FLIP animations, and `Escape` cancellation.
- **Adaptive Navigation**: Scroll-spy vertical sidebar on desktop (`IntersectionObserver` attachment) and auto-centering sticky horizontal category bar on mobile viewports.
- **Theme & Localization**: Light and dark mode with `prefers-color-scheme` detection, plus automatic English and Simplified Chinese interface adaptation based on browser locale.

## Data Storage & Sync

- **Local Persistence**: Bookmark data and user preferences are persisted in `localStorage` and synchronized across open tabs via `storage` events.
- **GitHub Cloud Sync**: Synchronizes bookmark data (`profile.json`) directly with a designated GitHub repository via the GitHub REST API.
  - **Concurrency & Conflict Control**: Cancels stale in-flight requests via `AbortController` and verifies blob SHAs before writes. When remote and local states diverge, prompts to either **Force Push** (overwrite remote) or **Reset to Remote** (discard local changes).
  - **Token Scope**: Use a **Fine-grained Personal Access Token (PAT)** scoped strictly to the target repository with `Contents: Read and write` permission.
- **Offline Backup**: Export bookmarks to a formatted JSON file (via `showSaveFilePicker` with standard download fallback) and restore from JSON backups.

## Project Structure

```text
src/
├── assets/              # Static icons and search engine assets
├── components/
│   ├── business/        # Stateful feature components (grid, header, catalog, search)
│   ├── modals/          # On-demand dynamically imported dialog views
│   └── ui/              # Stateless UI primitives (Button, Card, Icon, Input, Modal)
├── lib/
│   ├── actions/         # Reactive DOM attachments ({@attach} for drag-and-drop and tooltip)
│   ├── config/          # Search engine presets
│   ├── core/            # Global reactive state singletons (appState, dataState)
│   ├── infra/           # Low-level adapters (GitHub REST client, LocalStorage wrapper)
│   ├── services/        # Business logic and sync orchestration (manager, sync)
│   ├── constants.ts     # Layout, animation, and timeout constants
│   ├── i18n.ts          # Localization dictionaries (EN / ZH)
│   ├── types.ts         # Shared TypeScript interfaces
│   └── utils.ts         # Reactive media queries, icon resolution, and helpers
├── App.svelte           # Root layout and modal/toast host
├── app.css              # Tailwind CSS theme tokens and native popover/dialog transitions
└── main.ts              # Application mount entrypoint
```

## Getting Started

### Prerequisites

- Node.js (LTS / Current)
- pnpm

### Development & Verification

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Format, lint, and run static type checks (enforced by CI)
pnpm format
pnpm lint
pnpm check

# Build for production
pnpm build
```

## License

Licensed under the [GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-or-later).
