import { on } from 'svelte/events';
import { STORAGE_KEYS, storage } from '../infra/storage';
import type { GithubConfig, Group, NavData, SyncStatus } from '../types';

class DataCore {
  groups = $state<Group[]>([]);
  config = $state<GithubConfig>({ owner: '', repo: '', token: '' });

  lastSha = $state('');
  isDirty = $state(false);

  syncStatus = $state<SyncStatus>('idle');
  syncError = $state<string | undefined>(undefined);

  hasToken = $derived(!!this.config.token);
  isReady = $derived(this.groups.length > 0 || this.syncStatus !== 'checking');

  constructor() {
    this.groups = this.sanitizeGroups(storage.data.groups);
    this.config = storage.config;
    this.lastSha = storage.sha;

    $effect.root(() => {
      let isFirstRun = true;
      let timer: number;

      $effect(() => {
        // Read snapshot synchronously to track all deep reactive dependencies
        const snapshot = $state.snapshot(this.groups);

        if (isFirstRun) {
          isFirstRun = false;
          return;
        }

        clearTimeout(timer);
        timer = window.setTimeout(() => {
          storage.data = { groups: snapshot };
        }, 500);

        return () => clearTimeout(timer);
      });

      $effect(() => {
        storage.config = this.config;
      });

      $effect(() => {
        storage.sha = this.lastSha;
      });

      $effect(() =>
        on(window, 'storage', (e) => {
          if (e.key === STORAGE_KEYS.DATA && e.newValue) {
            try {
              const parsed = JSON.parse(e.newValue);
              if (Array.isArray(parsed.groups)) {
                this.groups = this.sanitizeGroups(parsed.groups);
              }
            } catch (err) {
              console.error('Cross-tab sync error:', err);
            }
          }

          if (e.key === STORAGE_KEYS.CONFIG && e.newValue) {
            try {
              this.config = JSON.parse(e.newValue);
            } catch (err) {
              console.error('Cross-tab config sync error:', err);
            }
          }
        })
      );
    });
  }

  private isValidHttpUrl(rawUrl: string): boolean {
    if (!URL.canParse(rawUrl)) return false;
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  }

  private sanitizeGroups(groups: unknown): Group[] {
    if (!Array.isArray(groups)) return [];
    return groups
      .filter((g): g is Record<string, unknown> => !!g && typeof g === 'object')
      .map((g) => ({
        id: typeof g.id === 'string' && g.id.trim() ? g.id : crypto.randomUUID(),
        name: typeof g.name === 'string' && g.name.trim() ? g.name.trim() : 'Untitled',
        sites: Array.isArray(g.sites)
          ? g.sites
              .filter((s): s is Record<string, unknown> => {
                if (!s || typeof s !== 'object') return false;
                if (typeof s.url !== 'string' || typeof s.name !== 'string') return false;
                return this.isValidHttpUrl(s.url.trim());
              })
              .map((s) => ({
                id: typeof s.id === 'string' && s.id.trim() ? s.id : crypto.randomUUID(),
                name: (s.name as string).trim(),
                url: (s.url as string).trim(),
                icon: typeof s.icon === 'string' ? s.icon.trim() : ''
              }))
          : []
      }));
  }

  markDirty() {
    this.isDirty = true;
  }

  setGroups(newGroups: Group[]) {
    this.groups = this.sanitizeGroups(newGroups);
    this.isDirty = true;
  }

  updateConfig(newConfig: GithubConfig) {
    this.config = newConfig;
  }

  updateSyncState(status: SyncStatus, sha?: string, error?: string) {
    this.syncStatus = status;
    if (sha) this.lastSha = sha;
    if (error) this.syncError = error;

    if (status === 'success') {
      this.syncError = undefined;
      this.isDirty = false;
    }
  }

  replaceData(newData: NavData, newSha: string) {
    this.groups = this.sanitizeGroups(newData.groups);
    this.lastSha = newSha;
    this.syncStatus = 'success';
    this.isDirty = false;
  }
}

export const dataState = new DataCore();
