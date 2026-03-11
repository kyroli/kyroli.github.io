import { storage } from '../infra/storage';
import { untrack } from 'svelte';
import type { NavData, Group, GithubConfig, SyncStatus } from '../types';

class DataCore {
  groups = $state<Group[]>([]);
  config = $state<GithubConfig>({ owner: '', repo: '', token: '' });
  
  lastSha = $state('');
  isDirty = $state(false);

  private skipDirtyCheck = false;
  
  syncStatus = $state<SyncStatus>('idle');
  syncError = $state<string | undefined>(undefined);

  hasToken = $derived(!!this.config.token);
  isReady = $derived(this.groups.length > 0 || this.syncStatus !== 'checking');

  constructor() {
    const rawGroups = storage.data.groups;
    this.groups = this.sanitizeGroups(rawGroups);
    this.config = storage.config;
    this.lastSha = storage.sha;
  }

  private sanitizeGroups(groups: Group[]): Group[] {
    return groups.map(g => ({
      ...g,
      sites: g.sites.map(s => ({
        ...s,
        url: s.url.trim()
      }))
    }));
  }

  init() {
    let isFirstRun = true;

    $effect(() => {
      storage.data = { groups: this.groups };
      
      untrack(() => {
        if (isFirstRun) {
          isFirstRun = false;
          return;
        }
        if (this.skipDirtyCheck) {
          this.skipDirtyCheck = false;
          return;
        }
        this.isDirty = true;
      });
    });

    $effect(() => {
      storage.config = this.config;
    });

    $effect(() => {
      storage.sha = this.lastSha;
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'nav_data' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed.groups)) {
              this.skipDirtyCheck = true;
              this.groups = this.sanitizeGroups(parsed.groups);
            }
          } catch (err) {
            console.error('Cross-tab sync error:', err);
          }
        }
        
        if (e.key === 'nav_cfg' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.config = parsed;
          } catch (err) {
            console.error('Cross-tab config sync error:', err);
          }
        }
      });
    }
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
    this.skipDirtyCheck = true;
    this.groups = this.sanitizeGroups(newData.groups);
    this.lastSha = newSha;
    this.syncStatus = 'success';
    this.isDirty = false;
  }
}

export const dataState = new DataCore();