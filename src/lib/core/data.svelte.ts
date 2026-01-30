import { storage } from '../infra/storage';
import type { NavData, Group, GithubConfig, SyncStatus } from '../types';

class DataCore {
  groups = $state<Group[]>([]);
  config = $state<GithubConfig>({ owner: '', repo: '', token: '' });
  
  lastSha = $state('');
  isDirty = $state(false);
  syncStatus = $state<SyncStatus>('idle');
  syncError = $state<string | undefined>(undefined);

  hasToken = $derived(!!this.config.token);
  isReady = $derived(this.syncStatus !== 'checking');

  constructor() {
    this.groups = storage.data.groups;
    this.config = storage.config;
    this.lastSha = storage.sha;
    this.isDirty = storage.isDirty;

    $effect(() => {
      storage.data = { groups: this.groups };
    });

    $effect(() => {
      storage.config = this.config;
    });

    $effect(() => {
      storage.sha = this.lastSha;
    });

    $effect(() => {
      storage.isDirty = this.isDirty;
    });
  }

  setGroups(newGroups: Group[]) {
    this.groups = newGroups;
    this.markDirty();
  }

  updateConfig(newConfig: GithubConfig) {
    this.config = newConfig;
  }

  updateSyncState(status: SyncStatus, sha?: string, error?: string) {
    this.syncStatus = status;
    if (sha) this.lastSha = sha;
    if (error) this.syncError = error;
    
    if (status === 'success') {
      this.isDirty = false;
      this.syncError = undefined;
    }
  }

  markDirty() {
    this.isDirty = true;
  }

  replaceData(newData: NavData, newSha: string) {
    this.groups = newData.groups;
    this.lastSha = newSha;
    this.isDirty = false;
    this.syncStatus = 'success';
  }
}

export const dataState = new DataCore();