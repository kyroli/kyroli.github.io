import type { GithubConfig, NavData } from './types';

interface AssetModule {
  default?: string;
  src?: string;
}

// 使用 unknown 替代 any
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
    return `https://favicon.vemetric.com/${domain}&size=64`;
  } catch {
    return assets['globe'] || ''; 
  }
};

const KEYS = {
  CONFIG: 'nav_cfg',
  DATA: 'nav_data',
  THEME: 'nav_theme',
  DIRTY: 'nav_dirty',
  SHA: 'nav_sha'
} as const;

// 类型守卫：运行时校验数据结构
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
      // 即使本地存储被篡改，也能保证返回类型安全
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