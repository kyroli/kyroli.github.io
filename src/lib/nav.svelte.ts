import { getRemoteInfo, pushNav } from './github';
import { storage, resolveError, AppError } from './utils';
import type { NavData, GithubConfig, Group, Site } from './types';

type InitResult = 
  | { type: 'ready' | 'updated' }
  | { type: 'conflict'; serverData: NavData; serverSha: string };

class NavState {
  config = $state<GithubConfig>({ owner: '', repo: '', token: '' });
  data = $state<NavData>({ groups: [] });
  
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
      groups: data.groups || []
    };
  }

  private handleStorageChange(e: StorageEvent) {
    if (e.key === storage.KEYS.DATA && e.newValue) {
      try { this.data = this.normalizeData(JSON.parse(e.newValue)); } catch {}
    }
    if (e.key === storage.KEYS.SHA && e.newValue) this.lastSha = e.newValue;
    if (e.key === storage.KEYS.DIRTY && e.newValue) this.isDirty = e.newValue === 'true';
  }

  async init(): Promise<InitResult> {
    if (!this.config.token) {
      this.status = 'ready';
      return { type: 'ready' };
    }

    this.status = this.data.groups.length > 0 ? 'ready' : 'syncing';

    try {
      const { sha, content } = await getRemoteInfo(this.config);
      const isRemoteNewer = sha !== this.lastSha;

      if (isRemoteNewer) {
        if (this.isDirty) {
          this.status = 'ready';
          return { type: 'conflict', serverData: content, serverSha: sha };
        } else {
          this.applyRemoteData(content, sha);
          this.status = 'ready';
          return { type: 'updated' };
        }
      }
      
      this.status = 'ready';
      return { type: 'ready' };
    } catch (e) {
      const msg = resolveError(e);
      if (this.data.groups.length > 0) {
        this.status = 'ready';
        console.error("Init sync skipped:", msg);
      } else {
        this.status = 'error';
        this.errorMsg = msg;
      }
      throw e;
    }
  }

  private applyRemoteData(content: NavData, sha: string) {
    this.data = this.normalizeData(content);
    this.lastSha = sha;
    this.isDirty = false;
    this.saveAll();
  }

  applyServerData(content: NavData, sha: string) {
    this.applyRemoteData(content, sha);
  }

  async sync() {
    if (!this.isDirty) return;
    this.isSyncing = true;
    
    try {
      const newSha = await pushNav(this.config, this.data, this.lastSha);
      this.finalizeSync(newSha);
    } catch (e) {
      throw e;
    } finally {
      this.isSyncing = false;
    }
  }

  async forceSync() {
    this.isSyncing = true;
    try {
      const { sha } = await getRemoteInfo(this.config);
      const newSha = await pushNav(this.config, this.data, sha);
      this.finalizeSync(newSha);
    } catch (e) {
      throw e;
    } finally {
      this.isSyncing = false;
    }
  }

  async updateConfig(cfg: GithubConfig) {
    this.config = cfg;
    storage.saveConfig(cfg);
    return await this.init();
  }

  async reset() {
    this.isDirty = false;
    storage.setDirty(false);
    this.status = 'syncing';
    await this.init(); 
  }

  private finalizeSync(sha: string) {
    this.lastSha = sha;
    this.isDirty = false;
    this.saveAll();
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

  addGroup(name: string) {
    this.data.groups.push({ id: crypto.randomUUID(), name, sites: [] });
    this.markDirty();
  }

  renameGroup(groupId: string, name: string) {
    const g = this.data.groups.find(x => x.id === groupId);
    if (g) { g.name = name; this.markDirty(); }
  }

  deleteGroup(groupId: string) {
    this.data.groups = this.data.groups.filter(x => x.id !== groupId);
    this.markDirty();
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
    
    this.markDirty();
  }

  deleteSite(groupId: string, siteId: string) {
    const g = this.data.groups.find(x => x.id === groupId);
    if (g) { 
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
      
      const cleanGroups = json.groups.map((g: any) => ({
        id: g.id || crypto.randomUUID(),
        name: g.name || 'Unnamed Group',
        sites: Array.isArray(g.sites) ? g.sites.map((s: any) => {
          let url = s.url || '';
          if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
          if (!/^https?:\/\//i.test(url)) url = '';

          return {
            id: s.id || crypto.randomUUID(),
            name: s.name || 'Unnamed',
            url: url,
            icon: s.icon || ''
          };
        }) : []
      }));

      this.data = { groups: cleanGroups };
      this.markDirty();
    } catch (e) {
      throw e;
    }
  }
}

export const nav = new NavState();