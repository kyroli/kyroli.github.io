```text
Kilonova/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages 自动化部署工作流
├── src/                        # 源代码主目录
│   ├── assets/                 # 静态资源目录 (内置图标与图片)
│   │   ├── bing.webp
│   │   ├── duckduckgo.webp
│   │   ├── globe.svg
│   │   ├── gmail.webp
│   │   ├── google.webp
│   │   └── yandex.webp
│   ├── components/             # Svelte 组件库
│   │   ├── business/           # 业务组件 (包含具体业务逻辑)
│   │   │   ├── CardBase.svelte        # 卡片基础布局容器
│   │   │   ├── Header.svelte          # 页面顶部导航区域
│   │   │   ├── HeaderControls.svelte  # 顶部状态与控制面板 (同步、设置)
│   │   │   ├── LoadingSkeleton.svelte # 页面加载占位骨架屏
│   │   │   ├── SearchBar.svelte       # 多引擎聚合搜索栏
│   │   │   ├── SiteCard.svelte        # 独立网站快捷方式卡片
│   │   │   └── SiteGrid.svelte        # 网站分组与网格展示布局
│   │   ├── modals/             # 弹窗与模态框组件
│   │   │   ├── ConfigModal.svelte     # GitHub 数据同步配置弹窗
│   │   │   ├── GroupModal.svelte      # 网站分组编辑弹窗
│   │   │   └── SiteModal.svelte       # 网站信息编辑弹窗
│   │   └── ui/                 # 基础 UI 组件 (通用、无状态设计)
│   │       ├── Button.svelte          # 基础按钮组件
│   │       ├── Card.svelte            # 基础卡片组件
│   │       ├── Input.svelte           # 基础输入框组件
│   │       ├── Modal.svelte           # 模态框底层封装
│   │       ├── ThemeSwitch.svelte     # 深色/浅色主题切换组件
│   │       └── TooltipContainer.svelte# 悬浮提示气泡挂载容器
│   ├── lib/                    # 核心模块与工具函数库
│   │   ├── actions/            # 自定义 Svelte Actions (DOM 操作封装)
│   │   │   ├── dnd.svelte.ts          # 拖拽排序指令与状态引擎
│   │   │   ├── popover.ts             # 弹出层级提升指令 (Top Layer)
│   │   │   └── tooltip.ts             # 悬浮提示指令
│   │   ├── config/             # 应用常规配置文件
│   │   │   └── search.ts              # 搜索引擎列表与默认项配置
│   │   ├── core/               # 核心状态管理 (基于 Svelte 5 Runes)
│   │   │   ├── app.svelte.ts          # 应用全局状态 (UI、弹窗、交互状态)
│   │   │   └── data.svelte.ts         # 核心数据状态 (导航数据、同步配置)
│   │   ├── infra/              # 基础设施层
│   │   │   ├── github.ts              # GitHub REST API 客户端封装
│   │   │   └── storage.ts             # LocalStorage 数据持久化接口
│   │   ├── services/           # 业务逻辑服务层
│   │   │   ├── manager.ts             # 节点数据管理与备份导出/导入服务
│   │   │   └── sync.ts                # 云端数据双向同步服务
│   │   ├── utils/              # 纯工具函数库
│   │   │   └── cn.ts                  # Tailwind 动态类名合并工具
│   │   ├── constants.ts        # 全局常量定义配置
│   │   ├── i18n.ts             # 本地化文案与界面提示语配置
│   │   ├── types.ts            # 全局 TypeScript 接口与类型声明
│   │   └── utils.ts            # 默认图标解析与其他通用工具
│   ├── App.svelte              # 应用根组件
│   ├── app.css                 # 全局样式与 Tailwind 基础指令
│   ├── main.ts                 # 客户端挂载与应用主入口
│   └── vite-env.d.ts           # Vite 环境依赖类型声明
├── index.html                  # 应用入口 HTML 模板
├── package.json                # 项目依赖清单与 NPM 脚本
├── README.md                   # 项目说明文档
├── tsconfig.json               # TypeScript 编译配置文件
└── vite.config.ts              # Vite 构建工具与插件配置
```