import type { GithubConfig, NavData } from './types';
import { MESSAGES } from './i18n';

// =========================================
// 1. 全局常量定义 (Global Constants)
// =========================================
export const UI_CONSTANTS = {
  CARD_HEIGHT: "h-[72px]"
} as const;

// =========================================
// 2. 工具函数 (Utilities)
// =========================================

export function resolveError(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  
  // 1. 精确匹配已知错误
  if (code in MESSAGES.ERRORS) {
    return MESSAGES.ERRORS[code as keyof typeof MESSAGES.ERRORS];
  }
  
  // 2. 处理 HTTP 状态码错误
  if (code.startsWith('HTTP_ERROR_')) {
    const status = code.replace('HTTP_ERROR_', '');
    if (status === '403') return MESSAGES.ERRORS.FORBIDDEN;
    if (status === '404') return MESSAGES.ERRORS.NOT_FOUND;
    return `${MESSAGES.ERRORS.SERVER_ERROR} (${status})`;
  }

  // 3. 处理网络类模糊错误
  if (code.toLowerCase().includes('fetch') || code.toLowerCase().includes('network')) {
    return MESSAGES.ERRORS.NETWORK_ERROR;
  }

  // 4. 兜底返回
  return `${MESSAGES.TOAST.UNKNOWN_ERROR} (${code})`;
}

interface AssetModule {
  default?: string;
  src?: string;
}

const glob = import.meta.glob<AssetModule>('@/assets/*.{png,jpg,jpeg,webp,svg}', { eager: true });

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
// 3. 存储管理 (Storage)
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