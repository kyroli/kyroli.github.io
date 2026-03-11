export const UI_CONSTANTS = {
  CARD_HEIGHT: "h-[72px]",
  GRID_LAYOUT: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6"
} as const;

export const DND_CONSTANTS = {
  SCROLL_ZONE: 100,
  SCROLL_SPEED_PER_SEC: 3000,
  DRAG_THRESHOLD: 5,
  VIRTUAL_EXPANSION: 100
} as const;

// 动画与过渡时间常数 (单位: 毫秒)
export const ANIMATION_SPEED = {
  FADE_FAST: 150,     // 较快的淡出淡入 (提示、小图标等)
  FADE_NORMAL: 200,   // 标准的淡出淡入 (模态框、状态切换等)
  FADE_SLOW: 300,     // 较慢的淡出淡入 (页面级切换)
  DELAY_SHORT: 50,    // 短暂延迟
  FLIP: 300           // 拖拽排序时的卡片翻转排布时间
} as const;

// 系统级定时器常数 (单位: 毫秒)
export const APP_TIMEOUTS = {
  TOAST_DURATION: 3000,    // 全局提示框(Toast)的停留时间
  TOOLTIP_DELAY: 250,      // 悬浮提示(Tooltip)出现的延迟时间
  SKELETON_DELAY: 200      // 骨架屏显示的防闪烁延迟时间
} as const;