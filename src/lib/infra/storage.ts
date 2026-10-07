import type { GithubConfig, NavData } from '../types';

export const STORAGE_KEYS = {
  DATA: 'nav_data',
  CONFIG: 'nav_cfg',
  THEME: 'nav_theme',
  SHA: 'nav_sha',
  ENGINE: 'nav_engine'
} as const;

export const storage = {
  get config(): GithubConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    try {
      return raw ? JSON.parse(raw) : { owner: '', repo: '', token: '' };
    } catch {
      return { owner: '', repo: '', token: '' };
    }
  },

  set config(v: GithubConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(v));
  },

  get data(): NavData {
    const raw = localStorage.getItem(STORAGE_KEYS.DATA);
    try {
      return raw ? JSON.parse(raw) : { groups: [] };
    } catch {
      return { groups: [] };
    }
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
