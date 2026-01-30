import type { NavData, AppConfig, GithubConfig } from '../types';

const KEYS = {
  DATA: 'nav_data',
  CONFIG: 'nav_cfg',
  THEME: 'nav_theme',
  SHA: 'nav_sha',
  DIRTY: 'nav_dirty'
} as const;

function safeParse<T>(key: string, validator: (data: any) => data is T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return validator(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

function isGithubConfig(data: any): data is GithubConfig {
  return data && typeof data.owner === 'string' && typeof data.repo === 'string';
}

function isNavData(data: any): data is NavData {
  return data && Array.isArray(data.groups);
}

export const storage = {
  get config(): GithubConfig {
    return safeParse(KEYS.CONFIG, isGithubConfig, { owner: '', repo: '', token: '' });
  },

  set config(v: GithubConfig) {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(v));
  },

  get data(): NavData {
    return safeParse(KEYS.DATA, isNavData, { groups: [] });
  },

  set data(v: NavData) {
    localStorage.setItem(KEYS.DATA, JSON.stringify(v));
  },

  get sha(): string {
    return localStorage.getItem(KEYS.SHA) || '';
  },

  set sha(v: string) {
    localStorage.setItem(KEYS.SHA, v);
  },

  get isDirty(): boolean {
    return localStorage.getItem(KEYS.DIRTY) === 'true';
  },

  set isDirty(v: boolean) {
    localStorage.setItem(KEYS.DIRTY, String(v));
  },

  get theme(): string | null {
    return localStorage.getItem(KEYS.THEME);
  },

  set theme(v: string) {
    localStorage.setItem(KEYS.THEME, v);
  },
  
  KEYS
};