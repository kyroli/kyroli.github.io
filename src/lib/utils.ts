import type { GithubConfig, NavData } from './types';
import { MESSAGES } from './i18n';

// =========================================
// 1. 全局常量
// =========================================
export const UI_CONSTANTS = {
  CARD_HEIGHT: "h-[72px]",
  SEARCH_ENGINE_URL: "https://www.bing.com/search?q=",
  GRID_LAYOUT: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6"
} as const;

// =========================================
// 2. 错误治理
// =========================================

export class AppError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || code);
    this.name = 'AppError';
    this.code = code;
  }
}

export function resolveError(err: unknown): string {
  if (err instanceof AppError) {
    const msg = MESSAGES.ERRORS[err.code as keyof typeof MESSAGES.ERRORS];
    return msg || `${MESSAGES.TOAST.UNKNOWN_ERROR} (${err.code})`;
  }

  if (err instanceof Error) {
    if (err.message === 'Failed to fetch') return MESSAGES.ERRORS.NETWORK_ERROR;
    return err.message;
  }

  return MESSAGES.TOAST.UNKNOWN_ERROR;
}

// =========================================
// 3. 资源管理
// =========================================
interface AssetModule {
  default?: string;
  src?: string;
}

const glob = import.meta.glob<AssetModule>('../assets/*.{png,jpg,jpeg,webp,svg}', { eager: true });

const assets = Object.fromEntries(
  Object.entries(glob).map(([path, module]) => {
    if (!module) return ['', ''];
    const fileName = path.split('/').pop()?.split('.')[0].toLowerCase() ?? '';
    const src = module.default ?? module.src ?? '';
    return [fileName, src];
  })
);

export const getIcon = (url: string, custom?: string): string => {
  if (custom && assets[custom.toLowerCase()]) {
    return assets[custom.toLowerCase()];
  }
  
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return `https://favicon.vemetric.com/${domain}&size=128`;
  } catch {
    return assets['globe'] || ''; 
  }
};

// =========================================
// 4. 存储管理
// =========================================
const KEYS = {
  CONFIG: 'nav_cfg',
  DATA: 'nav_data',
  THEME: 'nav_theme',
  DIRTY: 'nav_dirty',
  SHA: 'nav_sha'
} as const;

function isGithubConfig(data: unknown): data is GithubConfig {
  return (
    typeof data === 'object' && 
    data !== null && 
    'owner' in data && 
    'repo' in data && 
    'token' in data
  );
}

function isNavData(data: unknown): data is NavData {
  return (
    typeof data === 'object' && 
    data !== null && 
    'groups' in data && 
    Array.isArray((data as any).groups)
  );
}

export const storage = {
  getConfig: (): GithubConfig => {
    try {
      const raw = localStorage.getItem(KEYS.CONFIG);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return isGithubConfig(parsed) ? parsed : { owner: '', repo: '', token: '' };
    } catch { 
      return { owner: '', repo: '', token: '' }; 
    }
  },
  
  saveConfig: (cfg: GithubConfig) => localStorage.setItem(KEYS.CONFIG, JSON.stringify(cfg)),

  getData: (): NavData => {
    try {
      const raw = localStorage.getItem(KEYS.DATA);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return isNavData(parsed) ? parsed : { groups: [] };
    } catch { 
      return { groups: [] }; 
    }
  },

  saveData: (data: NavData) => localStorage.setItem(KEYS.DATA, JSON.stringify(data)),

  getSha: () => localStorage.getItem(KEYS.SHA) || '',
  saveSha: (sha: string) => localStorage.setItem(KEYS.SHA, sha),

  getDirty: () => localStorage.getItem(KEYS.DIRTY) === 'true',
  setDirty: (isDirty: boolean) => localStorage.setItem(KEYS.DIRTY, String(isDirty)),

  getTheme: () => localStorage.getItem(KEYS.THEME),
  saveTheme: (isDark: boolean) => localStorage.setItem(KEYS.THEME, isDark ? 'dark' : 'light'),
  
  KEYS
};