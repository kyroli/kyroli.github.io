/**
 * @description 全局常量配置文件，集中管理系统预设参数与硬编码值。
 * 通过 `as const` 断言将其转换为只读的字面量类型，确保类型安全并防止运行时篡改。
 */

/**
 * UI 尺寸与响应式布局常量
 * 统一管理核心组件的视觉尺寸与网格断点，确保跨组件（如 SiteCard, LoadingSkeleton 等）的渲染一致性。
 */
export const UI_CONSTANTS = {
  /** 网站卡片与占位骨架的统一高度 */
  CARD_HEIGHT: "h-[72px]",
  /** 响应式网格断点规则，全局统一控制不同视口宽度下的列数与间距 */
  GRID_LAYOUT: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6"
} as const;

/**
 * 拖拽交互引擎预设参数
 * 定义拖拽行为的边界条件与反馈阈值，优化跨组拖拽与长列表边缘滚动的交互体验。
 */
export const DND_CONSTANTS = {
  /** 边缘滚动触发区域高度(px)：拖拽节点进入距视口上下边缘此范围内时，触发系统级滚动 */
  SCROLL_ZONE: 100,
  /** 边缘滚动最高速率(px/s)：控制长距离跨组拖拽时视口的自动移动效率 */
  SCROLL_SPEED_PER_SEC: 3000,
  /** 拖拽事件防抖阈值(px)：用于区分点击事件与拖拽事件，位移超过此距离方可激活拖拽状态 */
  DRAG_THRESHOLD: 5,
  /** 碰撞检测边界的虚拟扩展量(px)：放宽碰撞检测的判定范围，提升跨组释放节点的容错率 */
  VIRTUAL_EXPANSION: 100
} as const;

/**
 * 全局过渡动画配置时长 (单位: 毫秒)
 * 构建标准化的动效设计规范 (Motion Design System)，保持应用内视觉反馈的节奏统一。
 */
export const ANIMATION_SPEED = {
  /** 短暂过渡：适用于悬浮提示(Tooltip)、状态图标切换等即时视觉反馈 */
  FADE_FAST: 150,     
  /** 标准过渡：适用于模态框(Modal)显隐、核心状态切换等常规交互 */
  FADE_NORMAL: 200,   
  /** 较长过渡：适用于页面级模块装载或复杂的布局重排 */
  FADE_SLOW: 300,     
  /** 渲染微延迟：用于错开连续引发的组件渲染，形成平滑的视觉次序 */
  DELAY_SHORT: 50,    
  /** 拖拽排序重排时间：控制列表项自动避让和归位 (FLIP 动画) 的持续时长 */
  FLIP: 300           
} as const;

/**
 * 系统级定时器阈值配置 (单位: 毫秒)
 */
export const APP_TIMEOUTS = {
  /** 全局状态提示(Toast)的默认驻留时长 */
  TOAST_DURATION: 3000,    
  /** 悬浮提示(Tooltip)触发防抖延迟：防止光标快速划过界面时引发非预期的气泡渲染 */
  TOOLTIP_DELAY: 250,      
  /** 骨架屏防闪烁延迟：当数据返回耗时低于此阈值时，抑制骨架屏渲染以避免无效的 FOUC 闪烁 */
  SKELETON_DELAY: 200      
} as const;