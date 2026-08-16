# Kilonova

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Biome](https://img.shields.io/badge/Linted_by-Biome-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev/)

简体中文 | [English](./README.md)

一个个人浏览器起始页与书签管理器。

## 技术选型

- **技术栈**：Svelte 5 (Runes) + Vite 8 + Tailwind CSS v4 + TypeScript 7。
- **现代浏览器**：仅面向支持 ESNext 标准的现代浏览器，不包含任何旧版 Polyfill。
- **架构模式**：无后端静态客户端，直接与浏览器 API 及 GitHub REST API 交互。
- **代码规范**：由 Biome 执行代码格式化与静态检查。

## 核心特性

- **多引擎搜索**：预置 Bing、Google、DuckDuckGo 与 Yandex 搜索引擎切换。支持 `/` 或 `Ctrl/Cmd + K` 聚焦搜索框，按 `Escape` 失焦。
- **拖拽重排**：在编辑模式下支持对分组与站点链接进行拖拽排序，具备 FLIP 过渡动画与边缘滚动检测。
- **卡片微交互**：基于鼠标指针位置的站点卡片 3D 悬浮透视与高光反射效果。
- **响应式导航**：桌面端提供滚动联动的侧边栏目录；移动端采用吸顶横向滚动分类条，支持高亮项自动滑动居中。
- **主题模式**：支持深色/浅色模式切换，适配系统偏好（`prefers-color-scheme`）并集成 View Transitions。
- **界面语言**：根据浏览器系统语言自动适配简体中文或英文界面。
- **本地存储**：数据保存于浏览器 LocalStorage，支持跨标签页实时同步。
- **云端同步**：通过 GitHub REST API 同步数据至指定仓库，内置基于 SHA 的版本冲突检测。
- **离线备份**：支持以标准 JSON 格式导出与恢复书签数据。

## 数据存储与同步

- **本地存储 (LocalStorage)**：书签结构、偏好配置与主题设置保存在浏览器本地，并通过 Storage API 在多个打开的标签页间同步。
- **GitHub 同步**：使用保存在本地的 Fine-grained PAT 直接同步至指定的专用 GitHub 仓库。
  * ⚠️ **安全说明**：请使用 **Fine-grained PAT**，并将权限严格限定在存放数据的仓库（`Contents: Read and write`）。
- **冲突处理**：在写入前比对提交 SHA。检测到冲突时提供 **Force Push**（覆盖云端）或 **Reset to Remote**（拉取云端覆盖本地）选项。
- **数据导入与导出**：支持标准 JSON 格式的序列化导出与解析导入，便于离线备份与迁移。

## 项目结构

```text
src/
├── assets/              # 静态资源（图标、图片）
├── components/          # 视图层 (UI Components)
│   ├── business/        # 有状态的业务组件
│   ├── modals/          # 弹窗与设置模态框
│   └── ui/              # 无状态的复用基础组件
├── lib/                 # 逻辑层 (Core Logic)
│   ├── actions/         # Svelte 自定义指令（如拖拽、3D 倾斜、提示框等）
│   ├── config/          # 系统配置与预设（搜索引擎配置、默认数据等）
│   ├── core/            # 响应式全局状态管理（Svelte Runes）
│   ├── infra/           # 基础设施层（GitHub API 客户端、本地存储适配器）
│   ├── services/        # 核心业务服务（同步调度器、数据管理器）
│   ├── types.ts         # TypeScript 类型定义
│   └── utils.ts         # 辅助工具函数
├── App.svelte           # 应用入口组件
├── app.css              # 全局样式
└── main.ts              # 应用引导入口
```

## 快速开始

### 开发要求
- Node.js >= 22.0.0
- pnpm >= 10.0.0

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm dev

# 3. 生产环境构建
pnpm build

# 4. 校验与格式化
pnpm format
pnpm lint
pnpm check
```

*注意：CI/CD 部署流程基于 GitHub Actions 运行，若未通过 Biome 的格式化与静态检查，构建流程将会被拦截。*

## 开源协议

本项目采用 [GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0) 开源协议。
