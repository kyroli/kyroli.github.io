import { on } from 'svelte/events';
import { STORAGE_KEYS, storage } from '../infra/storage';
import type { GithubConfig, Group, NavData, SyncStatus } from '../types';
import { isValidHttpUrl } from '../utils';

class DataCore {
  groups = $state<Group[]>([]);
  config = $state<GithubConfig>({ owner: '', repo: '', token: '' });

  lastSha = $state('');
  isDirty = $state(false);

  syncStatus = $state<SyncStatus>('idle');
  syncError = $state<string | undefined>(undefined);

  hasToken = $derived(!!this.config.token);
  isReady = $derived(
    this.groups.length > 0 || (this.syncStatus !== 'checking' && this.syncStatus !== 'error')
  );

  constructor() {
    this.groups = this.sanitizeGroups(storage.data.groups);
    this.config = storage.config;
    this.lastSha = storage.sha;
    this.isDirty = storage.dirty;

    $effect.root(() => {
      let skipGroupsSync = true;

      $effect(() => {
        // Read snapshot synchronously to track all deep reactive dependencies
        const snapshot = $state.snapshot(this.groups);
        if (skipGroupsSync) {
          skipGroupsSync = false;
          return;
        }
        storage.data = { groups: snapshot };
      });

      $effect(() =>
        on(window, 'storage', (e) => {
          if (e.key === STORAGE_KEYS.DATA) {
            skipGroupsSync = true;
            this.groups = this.sanitizeGroups(storage.data.groups);
          }

          if (e.key === STORAGE_KEYS.CONFIG) {
            const nextConfig = storage.config;
            if (nextConfig.owner !== this.config.owner || nextConfig.repo !== this.config.repo) {
              this.lastSha = '';
              this.syncError = undefined;
            }
            this.config = nextConfig;
          }

          let remoteUpdated = false;
          if (e.key === STORAGE_KEYS.SHA && e.newValue !== null) {
            this.lastSha = e.newValue;
            remoteUpdated = true;
          } else if (e.key === STORAGE_KEYS.DIRTY) {
            this.isDirty = e.newValue === '1';
            remoteUpdated = true;
          }

          if (
            remoteUpdated &&
            !this.isDirty &&
            (this.syncStatus === 'conflict' || this.syncStatus === 'error')
          ) {
            this.updateSyncState('success');
          }
        })
      );
    });
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
                return isValidHttpUrl(s.url.trim());
              })
              .map((s) => ({
                id: typeof s.id === 'string' && s.id.trim() ? s.id : crypto.randomUUID(),
                name: (s.name as string).trim(),
                url: (s.url as string).trim()
              }))
          : []
      }));
  }

  markDirty() {
    this.isDirty = true;
    storage.dirty = true;
  }

  setGroups(newGroups: Group[]) {
    this.groups = this.sanitizeGroups(newGroups);
    this.markDirty();
  }

  updateConfig(newConfig: GithubConfig) {
    const repoChanged =
      newConfig.owner !== this.config.owner || newConfig.repo !== this.config.repo;
    this.config = newConfig;
    storage.config = newConfig;
    if (repoChanged) {
      this.lastSha = '';
      this.syncError = undefined;
      storage.sha = '';
    }
  }

  updateSyncState(status: SyncStatus, error?: string) {
    this.syncStatus = status;
    this.syncError = error;
  }

  markSynced(sha: string) {
    this.updateSyncState('success');
    this.isDirty = false;
    storage.dirty = false;
    if (sha) {
      this.lastSha = sha;
      storage.sha = sha;
    }
  }

  replaceData(newData: NavData, newSha: string) {
    this.groups = this.sanitizeGroups(newData.groups);
    this.markSynced(newSha);
  }
}

export const dataState = new DataCore();
