import type { GithubConfig, NavData } from './types';

// =========================================
// 1. 全局常量定义 (Global Constants)
// =========================================
export const UI_CONSTANTS = {
  // 统一卡片高度，避免视觉拼接痕迹
  CARD_HEIGHT: "h-[72px]"
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  'REPO_NOT_FOUND': '找不到该仓库，请检查“用户名/仓库名”是否正确',
  'TOKEN_INVALID': 'Token 无效或已过期，请重新生成',
  'CONFLICT': '云端数据已更新（版本冲突），请刷新或强制覆盖',
  'PUSH_FAILED': '同步推送失败，请检查网络连接',
  'Failed to fetch': '网络连接失败，请检查网络设置',
  'UNKNOWN': '发生未知错误'
};

// =========================================
// 2. 工具函数 (Utilities)
// =========================================

/**
 * 统一错误处理函数
 * 将技术错误代码转换为用户友好的中文提示
 */
export function resolveError(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  
  // 1. 精确匹配已知错误
  if (ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  
  // 2. 处理 HTTP 状态码错误
  if (code.startsWith('HTTP_ERROR_')) {
    const status = code.replace('HTTP_ERROR_', '');
    if (status === '403') return 'API 调用受限或无权限 (403)';
    if (status === '404') return '请求的资源不存在 (404)';
    return `服务器响应错误 (${status})`;
  }

  // 3. 处理网络类模糊错误
  if (code.toLowerCase().includes('fetch') || code.toLowerCase().includes('network')) {
    return ERROR_MESSAGES['Failed to fetch'];
  }

  // 4. 兜底返回
  return `${ERROR_MESSAGES['UNKNOWN']} (${code})`;
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