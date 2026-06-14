# Kilonova

简体中文 | [English](./README.md)

一个个人浏览器起始页与书签管理器。

## 技术选型

- **技术栈**：Svelte 5 + Vite 8 + Tailwind CSS v4 + TypeScript 6。
- **现代浏览器**：仅面向支持 ESNext 标准的现代浏览器，无 legacy polyfills。
- **工具链**：由 Biome 执行代码格式化与静态检查。

## 核心特性

- **拖拽排序**：支持调整书签分组及站点链接的顺序。
- **本地存储**：数据存储在本地浏览器，多标签页自动同步。
- **云端同步**：通过 GitHub API 同步至专用 GitHub 仓库。
- **主题切换**：支持深色/浅色模式切换。
- **响应式目录**：桌面端提供高亮联动的侧边栏目录；移动端采用吸顶横向滚动分类条，支持高亮标签自动滑动居中。

## 数据存储与同步

- **本地存储 (LocalStorage)**：数据和配置保存在浏览器本地，并在多个打开的标签页间同步。
- **GitHub 同步**：使用本地存储的 Fine-grained PAT 同步至指定的 GitHub 仓库（不使用 Gist 以防链接泄露，私有仓库提供严格的 ACL 权限控制）。
  * ⚠️ **安全提示**：请使用 **Fine-grained PAT**，且仅授予存放书签数据的仓库读写权限（Contents: Read & Write）。
- **冲突处理**：比对本地与云端版本，检测到冲突时提供强制推送 (Force Push) 或覆盖本地 (Reset to Remote) 选项。
- **数据备份**：支持以标准 JSON 文件格式导入或导出书签布局。

## 项目结构

项目采用 UI 视图与核心业务逻辑分离的结构：

```text
src/
├── assets/              # 静态资源（图标、图片）
├── components/          # 视图层 (UI Components)
│   ├── business/        # 有状态的业务组件
│   ├── modals/          # 弹窗与设置模态框
│   └── ui/              # 无状态的复用基础组件
├── lib/                 # 逻辑层 (Core Logic)
│   ├── actions/         # Svelte 自定义指令（如拖拽事件）
│   ├── config/          # 系统配置
│   ├── core/            # 响应式全局状态管理（Svelte Runes）
│   ├── infra/           # 基础设施层（GitHub API 客户端、本地存储适配器）
│   ├── services/        # 核心业务服务（同步器、数据管理器）
│   ├── types.ts         # TypeScript 类型定义
│   └── utils.ts         # 常用辅助工具函数
├── App.svelte           # 应用入口组件
├── app.css              # 全局样式
└── main.ts              # 入口文件
```

## 快速开始

### 开发要求
- Node.js >= 20.0.0
- pnpm >= 8.0.0

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm dev

# 3. 校验与格式化
pnpm format
pnpm lint
pnpm check
```

*注意：CI/CD 部署流程基于 GitHub Actions 运行，若未通过 Biome 的格式化与静态检查，构建流程将会被拦截。*
