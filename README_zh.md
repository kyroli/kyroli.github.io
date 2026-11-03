# Kilonova

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Biome](https://img.shields.io/badge/Biome-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev/)

简体中文 | [English](./README.md)

一个极简的个人浏览器起始页与书签管理器。

## 架构与技术标准

- **核心技术栈**：基于 Svelte（Runes、Attachments 及内置响应式原语）、Tailwind CSS、TypeScript 与 Vite（Lightning CSS）构建。
- **零外部 UI 运行时依赖**：完全基于框架内置原语与浏览器原生标准实现，不依赖任何第三方 UI 组件库或状态管理库。
- **原生 Web 标准实践**：
  - **Top Layer 与锚点定位**：模态框、下拉菜单、提示框（Tooltip）、通知（Toast）及拖拽浮层均采用原生 `<dialog closedby="any">`、Popover API（`popover`）与 CSS Anchor Positioning（`anchor-name`、`position-anchor`、`position-area`）。
  - **现代 CSS 特性**：采用 `oklch()` 色彩空间配合原生 `light-dark()` 主题函数与 `@starting-style` 离散过渡动画。
  - **ESNext 与原生接口**：仅面向现代浏览器，直接使用原生 `Uint8Array` Base64 编解码（`toBase64` / `fromBase64`）、`URL.canParse` 及 File System Access API（`showSaveFilePicker`）。
- **单向分层架构**：严格划分无状态基础组件（`ui/`）、业务视图与按需动态加载弹窗（`business/`、`modals/`）、领域服务（`services/`）、全局响应式状态（`core/`）与底层基础设施适配器（`infra/`）。

## 功能特性

- **多引擎搜索**：支持 Bing、Google、DuckDuckGo 与 Yandex 切换；支持通过 `/` 或 `Ctrl/Cmd + K` 快捷聚焦搜索框，按 `Escape` 失焦。
- **指针驱动拖拽引擎**：编辑模式下支持分组与站点卡片的跨组拖拽重排，内置网格碰撞检测、视口边缘自动滚动、FLIP 动画及 `Escape` 随时取消。
- **双端自适应导航**：桌面端提供基于 `IntersectionObserver` Attachment 联动的侧边目录；移动端提供吸顶横向分类导航并支持激活项自动滚动居中。
- **主题与多语言**：支持浅色/深色主题切换并自动检测系统 `prefers-color-scheme`，根据浏览器语言环境自动适配简体中文与英文界面。

## 数据存储与云端同步

- **本地持久化**：书签数据与偏好设置保存在浏览器 `localStorage` 中，并通过 `storage` 事件实现多标签页状态同步。
- **GitHub 云端同步**：通过 GitHub REST API 将数据（`profile.json`）直接同步至指定的 GitHub 仓库。
  - **并发控制与冲突处理**：通过 `AbortController` 自动中止过期的在途请求，并在写入前校验文件 SHA。当云端版本与本地未保存修改发生冲突时，提供**强制推送**（覆盖云端）或**重置为云端版本**（放弃本地更改）选项。
  - **令牌权限建议**：建议使用 **Fine-grained Personal Access Token (PAT)**，将访问范围严格限制在目标数据仓库，并仅授予 `Contents: Read and write` 权限。
- **离线备份与恢复**：支持将书签数据导出为标准 JSON 文件（优先调用 `showSaveFilePicker`，自动回退至常规下载）以及从 JSON 备份恢复。

## 目录结构

```text
src/
├── assets/              # 静态图标与搜索引擎资源
├── components/
│   ├── business/        # 业务视图组件（网格、顶栏、目录、搜索框等）
│   ├── modals/          # 按需动态加载（Dynamic Import）的配置与编辑弹窗
│   └── ui/              # 无状态基础 UI 组件（Button, Card, Icon, Input, Modal）
├── lib/
│   ├── actions/         # 响应式 DOM 附件（基于 {@attach} 的拖拽引擎与提示框）
│   ├── config/          # 搜索引擎预设配置
│   ├── core/            # 全局响应式状态单例（appState, dataState）
│   ├── infra/           # 基础设施适配器（GitHub REST 客户端、LocalStorage 封装）
│   ├── services/        # 业务逻辑与同步编排服务（manager, sync）
│   ├── constants.ts     # 布局尺寸、动画时长与超时常量
│   ├── i18n.ts          # 中英多语言字典与语言检测
│   ├── types.ts         # 全局 TypeScript 类型定义
│   └── utils.ts         # 响应式媒体查询、图标解析与通用工具函数
├── App.svelte           # 根布局及模态框/通知容器宿主
├── app.css              # Tailwind CSS 主题变量及原生顶层元素过渡样式
└── main.ts              # 应用挂载入口
```

## 快速开始

### 环境要求

- Node.js (LTS / Current)
- pnpm

### 本地开发与校验

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 代码格式化、静态检查与类型校验（CI 强制卡点）
pnpm format
pnpm lint
pnpm check

# 构建生产版本
pnpm build
```

## 开源协议

本项目基于 [GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-or-later) 协议开源。
