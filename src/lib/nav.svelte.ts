import { getRemoteInfo, pushNav } from './github';
import { storage, resolveError, AppError } from './utils';
import { MESSAGES } from './i18n';
import type { NavData, GithubConfig, Group, Site } from './types';


class NavState {
  config = $state<GithubConfig>({ owner: '', repo: '', token: '' });
  data = $state<NavData>({ groups: [] });
  
  status = $state<'init' | 'ready' | 'syncing' | 'error'>('init');
  errorMsg = $state('');
  isDirty = $state(false);
  isSyncing = $state(false);
  
  private lastSha = '';

  toastState = $state<{ msg: string; level: 'info' | 'error' | 'success'; id: number } | null>(null);
  confirmState = $state<{ msg: string; onConfirm: () => void; id: number } | null>(null);

  constructor() {
    this.loadLocal();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => this.handleStorageChange(e));
    }
  }

  private triggerToast(msg: string, level: 'info' | 'error' | 'success') {
    this.toastState = { msg, level, id: Date.now() };
  }

  private triggerConfirm(msg: string, onConfirm: () => void) {
    this.confirmState = { msg, onConfirm, id: Date.now() };
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

  async init() {
    if (!this.config.token) {
      this.status = 'ready';
      return;
    }

    this.status = this.data.groups.length > 0 ? 'ready' : 'syncing';

    try {
      const { sha, content } = await getRemoteInfo(this.config);
      
      const isRemoteNewer = sha !== this.lastSha;

      if (isRemoteNewer) {
        if (this.isDirty) {
          this.status = 'ready';
          this.triggerConfirm(
            `云端数据已有更新。${MESSAGES.CONFIRM.RESTORE}`,
            () => {
               this.applyRemoteData(content, sha);
               this.triggerToast(MESSAGES.TOAST.RESET_SUCCESS, 'success');
            }
          );
        } else {
          this.applyRemoteData(content, sha);
        }
      } else {
      }
      
      this.status = 'ready';
    } catch (e) {
      const msg = resolveError(e);
      if (this.data.groups.length > 0) {
        this.status = 'ready';
        console.error("Init sync skipped:", msg);
      } else {
        this.status = 'error';
        this.errorMsg = msg;
      }
    }
  }

  private applyRemoteData(content: NavData, sha: string) {
    this.data = this.normalizeData(content);
    this.lastSha = sha;
    this.isDirty = false;
    this.saveAll();
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

  async syncSafe() {
    try {
      await this.sync();
      this.triggerToast(MESSAGES.TOAST.SYNC_SUCCESS, 'success');
    } catch (e) {
      if (e instanceof AppError && e.code === 'CONFLICT') {
         this.triggerConfirm(
            MESSAGES.CONFIRM.CONFLICT, 
            async () => {
              try {
                await this.forceSync();
                this.triggerToast(MESSAGES.TOAST.OVERWRITE_SUCCESS, 'success');
              } catch (err) {
                this.triggerToast(`${MESSAGES.TOAST.OVERWRITE_FAIL_PREFIX}${resolveError(err)}`, 'error');
              }
            }
         );
         return;
      }
      this.triggerToast(`${MESSAGES.TOAST.SYNC_FAIL_PREFIX}${resolveError(e)}`, 'error');
    }
  }

  async resetSafe() {
    try {
      await this.reset();
      this.triggerToast(MESSAGES.TOAST.RESET_SUCCESS, 'success');
    } catch (e) {
      this.triggerToast(MESSAGES.TOAST.RESET_FAIL, 'error');
    }
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
          if (url && !/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
          }
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