import type { GithubConfig, NavData } from '../types';

export const STORAGE_KEYS = {
  DATA: 'nav_data',
  CONFIG: 'nav_cfg',
  THEME: 'nav_theme',
  SHA: 'nav_sha',
  ENGINE: 'nav_engine'
} as const;

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  get config(): GithubConfig {
    return readJson(STORAGE_KEYS.CONFIG, { owner: '', repo: '', token: '' });
  },

  set config(v: GithubConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(v));
  },

  get data(): NavData {
    return readJson(STORAGE_KEYS.DATA, { groups: [] });
  },

  set data(v: NavData) {
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(v));
  },

  get sha(): string {
    return localStorage.getItem(STORAGE_KEYS.SHA) || '';
  },

  set sha(v: string) {
    localStorage.setItem(STORAGE_KEYS.SHA, v);
  },

  get theme(): string | null {
    return localStorage.getItem(STORAGE_KEYS.THEME);
  },

  set theme(v: string) {
    localStorage.setItem(STORAGE_KEYS.THEME, v);
  },

  get engine(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ENGINE);
  },

  set engine(v: string) {
    localStorage.setItem(STORAGE_KEYS.ENGINE, v);
  }
};
