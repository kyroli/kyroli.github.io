/**
 * Global constants configuration for system-wide presets and hardcoded values.
 */

/**
 * UI dimensions and responsive layout constants.
 */
export const UI_CONSTANTS = {
  /** Uniform height for site cards and loading skeletons */
  CARD_HEIGHT: 'h-[72px]',
  /** Responsive grid layout classes */
  GRID_LAYOUT:
    'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6'
} as const;

/**
 * Drag and drop interaction constants.
 */
export const DND_CONSTANTS = {
  /** Edge scroll trigger zone height (px) */
  SCROLL_ZONE: 100,
  /** Maximum edge scroll speed (px/s) */
  SCROLL_SPEED_PER_SEC: 3000,
  /** Distance threshold to activate drag state (px) */
  DRAG_THRESHOLD: 5,
  /** Virtual expansion for collision detection (px) */
  VIRTUAL_EXPANSION: 100
} as const;

/**
 * Global animation speeds (ms).
 */
export const ANIMATION_SPEED = {
  /** Fast transition for immediate feedback (e.g., Tooltips) */
  FADE_FAST: 150,
  /** Standard transition for modals and general interactions */
  FADE_NORMAL: 200,
  /** Slow transition for page-level module loading */
  FADE_SLOW: 300,
  /** Micro-delay for smooth rendering sequence */
  DELAY_SHORT: 50,
  /** FLIP animation duration for drag and drop reordering */
  FLIP: 300
} as const;

/**
 * System-level timeout thresholds (ms).
 */
export const APP_TIMEOUTS = {
  /** Default duration for global toast messages */
  TOAST_DURATION: 3000,
  /** Debounce delay for tooltip triggering */
  TOOLTIP_DELAY: 250,
  /** Delay before showing skeleton to prevent flickering on fast loads */
  SKELETON_DELAY: 200
} as const;
