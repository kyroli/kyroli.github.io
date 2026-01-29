import { getRemoteInfo, pushNav } from './github';
import { storage, resolveError } from './utils';
import type { NavData, GithubConfig, Group, Site } from './types';

class NavState {
  config = $state<GithubConfig>({ owner: '', repo: '', token: '' });
  data = $state<NavData>({ groups: [], deletedIds: [] });
  
  status = $state<'init' | 'ready' | 'syncing' | 'error'>('init');
  errorMsg = $state('');
  isDirty = $state(false);
  isSyncing = $state(false);
  
  private lastSha = '';

  constructor() {
    this.loadLocal();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => this.handleStorageChange(e));
    }
  }

  private loadLocal() {
    this.config = storage.getConfig();
    this.data = this.normalizeData(storage.getData());
    this.lastSha = storage.getSha();
    this.isDirty = storage.getDirty();
  }

  private normalizeData(data: NavData): NavData {
    return {
      groups: data.groups || [],
      deletedIds: data.deletedIds || []
    };
  }

  private handleStorageChange(e: StorageEvent) {
    if (e.key === storage.KEYS.DATA && e.newValue) {
      try { this.data = this.normalizeData(JSON.parse(e.newValue)); } catch {}
    }
    if (e.key === storage.KEYS.SHA && e.newValue) this.lastSha = e.newValue;
    if (e.key === storage.KEYS.DIRTY && e.newValue) this.isDirty = e.newValue === 'true';
  }

  async init() {
    if (!this.config.token || this.isDirty) {
      this.status = 'ready';
      return;
    }

    this.status = this.data.groups.length > 0 ? 'ready' : 'syncing';

    try {
      const { sha, content } = await getRemoteInfo(this.config);
      this.data = this.normalizeData(content);
      this.lastSha = sha;
      this.isDirty = false;
      this.saveAll();
      this.status = 'ready';
    } catch (e) {
      const msg = resolveError(e);
      if (this.data.groups.length > 0) {
        this.status = 'ready';
        throw new Error(msg); 
      } else {
        this.status = 'error';
        this.errorMsg = msg;
        throw e;
      }
    }
  }

  async sync() {
    if (!this.isDirty) return;
    this.isSyncing = true;
    
    try {
      const newSha = await pushNav(this.config, this.data, this.lastSha);
      this.finalizeSync(newSha);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      
      if (err.message === 'CONFLICT') {
        await this.handleConflictMerge();
      } else {
        throw err;
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async handleConflictMerge() {
    const { sha: remoteSha, content: remoteData } = await getRemoteInfo(this.config);
    const mergedData = this.mergeData(this.data, this.normalizeData(remoteData));
    
    const newSha = await pushNav(this.config, mergedData, remoteSha);

    this.data = mergedData;
    this.finalizeSync(newSha);
  }

  private mergeData(local: NavData, remote: NavData): NavData {
    const merged = JSON.parse(JSON.stringify(local)) as NavData;
    
    const allDeleted = new Set([...(local.deletedIds || []), ...(remote.deletedIds || [])]);
    merged.deletedIds = Array.from(allDeleted);

    for (const rGroup of remote.groups) {
      if (allDeleted.has(rGroup.id)) continue;

      const lGroupIndex = merged.groups.findIndex(g => g.id === rGroup.id);

      if (lGroupIndex === -1) {
        const activeSites = rGroup.sites.filter(s => !allDeleted.has(s.id));
        if (activeSites.length > 0 || rGroup.sites.length === 0) {
           merged.groups.push({ ...rGroup, sites: activeSites });
        }
      } else {
        const lGroup = merged.groups[lGroupIndex];
        const localSiteIds = new Set(lGroup.sites.map(s => s.id));

        for (const rSite of rGroup.sites) {
          if (!allDeleted.has(rSite.id) && !localSiteIds.has(rSite.id)) {
            lGroup.sites.push(rSite);
          }
        }
      }
    }
    
    merged.groups = merged.groups.filter(g => !allDeleted.has(g.id));
    merged.groups.forEach(g => {
        g.sites = g.sites.filter(s => !allDeleted.has(s.id));
    });

    return merged;
  }

  private finalizeSync(sha: string) {
    this.lastSha = sha;
    this.isDirty = false;
    this.saveAll();
  }

  async updateConfig(cfg: GithubConfig) {
    this.config = cfg;
    storage.saveConfig(cfg);
    await this.init();
  }

  async reset() {
    this.isDirty = false;
    storage.setDirty(false);
    this.status = 'syncing';
    await this.init();
  }

  private saveAll() {
    storage.saveData(this.data);
    storage.saveSha(this.lastSha);
    storage.setDirty(this.isDirty);
  }

  private markDirty() {
    this.isDirty = true;
    this.saveAll();
  }

  private recordDeletion(id: string) {
    if (!this.data.deletedIds) this.data.deletedIds = [];
    if (!this.data.deletedIds.includes(id)) {
      this.data.deletedIds.push(id);
    }
  }

  addGroup(name: string) {
    this.data.groups.push({ id: crypto.randomUUID(), name, sites: [] });
    this.markDirty();
  }

  renameGroup(groupId: string, name: string) {
    const g = this.data.groups.find(x => x.id === groupId);
    if (g) { g.name = name; this.markDirty(); }
  }

  deleteGroup(groupId: string) {
    const g = this.data.groups.find(x => x.id === groupId);
    if (g) {
        this.recordDeletion(groupId);
        g.sites.forEach(s => this.recordDeletion(s.id));
        
        this.data.groups = this.data.groups.filter(x => x.id !== groupId);
        this.markDirty();
    }
  }

  updateGroups(groups: Group[]) {
    this.data.groups = groups;
    this.markDirty();
  }

  updateSites(groupId: string, sites: Site[]) {
    const g = this.data.groups.find(x => x.id === groupId);
    if (g) { g.sites = sites; this.markDirty(); }
  }

  moveSite(siteId: string, fromGroupId: string, toGroupId: string, newIndex: number) {
    const fromGroup = this.data.groups.find(g => g.id === fromGroupId);
    const toGroup = this.data.groups.find(g => g.id === toGroupId);
    if (!fromGroup || !toGroup) return;

    const idx = fromGroup.sites.findIndex(s => s.id === siteId);
    if (idx === -1) return;

    const [site] = fromGroup.sites.splice(idx, 1);
    toGroup.sites.splice(newIndex, 0, site);
    this.markDirty();
  }

  saveSite(groupId: string, site: Site) {
    const g = this.data.groups.find(x => x.id === groupId);
    if (!g) return;
    
    const idx = g.sites.findIndex(s => s.id === site.id);
    if (idx > -1) g.sites[idx] = site;
    else g.sites.push(site);
    
    if (this.data.deletedIds) {
        this.data.deletedIds = this.data.deletedIds.filter(id => id !== site.id);
    }
    
    this.markDirty();
  }

  deleteSite(groupId: string, siteId: string) {
    const g = this.data.groups.find(x => x.id === groupId);
    if (g) { 
        this.recordDeletion(siteId);
        g.sites = g.sites.filter(s => s.id !== siteId); 
        this.markDirty(); 
    }
  }

  exportBackup() {
    const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nav-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importBackup(file: File) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json || !Array.isArray(json.groups)) throw new Error('Invalid format');
      
      this.data = this.normalizeData(json);
      this.markDirty();
    } catch (e) {
      throw e;
    }
  }
}

export const nav = new NavState();