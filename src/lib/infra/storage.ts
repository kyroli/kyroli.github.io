import type { NavData, GithubConfig } from '../types';

const KEYS = {
  DATA: 'nav_data',
  CONFIG: 'nav_cfg',
  THEME: 'nav_theme',
  SHA: 'nav_sha',
  DIRTY: 'nav_dirty'
} as const;

export const storage = {
  get config(): GithubConfig {
    const raw = localStorage.getItem(KEYS.CONFIG);
    return raw ? JSON.parse(raw) : { owner: '', repo: '', token: '' };
  },

  set config(v: GithubConfig) {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(v));
  },

  get data(): NavData {
    const raw = localStorage.getItem(KEYS.DATA);
    return raw ? JSON.parse(raw) : { groups: [] };
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