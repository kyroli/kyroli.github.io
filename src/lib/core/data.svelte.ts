import { storage } from '../infra/storage';
import { gitHash } from '../crypto';
import type { NavData, Group, GithubConfig, SyncStatus } from '../types';

class DataCore {
  groups = $state<Group[]>([]);
  config = $state<GithubConfig>({ owner: '', repo: '', token: '' });
  
  lastSha = $state('');
  currentSha = $state('');
  
  isDirty = $derived(this.currentSha !== '' && this.currentSha !== this.lastSha);
  
  syncStatus = $state<SyncStatus>('idle');
  syncError = $state<string | undefined>(undefined);

  hasToken = $derived(!!this.config.token);
  isReady = $derived(this.groups.length > 0 || (this.syncStatus !== 'checking' && this.currentSha !== ''));

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
    $effect(() => {
      storage.data = { groups: this.groups };
      
      const json = JSON.stringify({ groups: this.groups }, null, 2);
      
      gitHash(json).then(sha => {
        this.currentSha = sha;
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
    }
  }

  replaceData(newData: NavData, newSha: string) {
    this.groups = this.sanitizeGroups(newData.groups);
    this.lastSha = newSha;
    this.syncStatus = 'success';
  }
}

export const dataState = new DataCore();