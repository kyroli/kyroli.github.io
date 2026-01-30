import { getRemoteInfo, pushNav } from './github';
import { storage, resolveError } from './utils';
import { Validation } from './validation';
import type { NavData, GithubConfig, Group, Site, OpResult } from './types';

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
    this.data = Validation.navData(storage.getData());
    this.lastSha = storage.getSha();
    this.isDirty = storage.getDirty();
  }

  private handleStorageChange(e: StorageEvent) {
    if (e.key === storage.KEYS.DATA && e.newValue) {
      try { this.data = Validation.navData(JSON.parse(e.newValue)); } catch {}
    }
    if (e.key === storage.KEYS.SHA && e.newValue) this.lastSha = e.newValue;
    if (e.key === storage.KEYS.DIRTY && e.newValue) this.isDirty = e.newValue === 'true';
  }

  async init(): Promise<OpResult> {
    if (!this.config.token) {
      this.status = 'ready';
      return { success: true };
    }

    this.status = this.data.groups.length > 0 ? 'ready' : 'syncing';

    try {
      const { sha, content } = await getRemoteInfo(this.config);
      const isRemoteNewer = sha !== this.lastSha;

      if (isRemoteNewer) {
        if (this.isDirty) {
          this.status = 'ready';
          return { 
            success: false, 
            type: 'conflict', 
            serverData: Validation.navData(content),
            serverSha: sha,
            msg: '云端数据已更新' 
          };
        } else {
          this.applyRemoteData(content, sha);
          this.status = 'ready';
          return { success: true, msg: '已自动同步最新数据' };
        }
      }
      
      this.status = 'ready';
      return { success: true };
    } catch (e) {
      const msg = resolveError(e);
      if (this.data.groups.length > 0) {
        this.status = 'ready';
        console.error("Init sync skipped:", msg);
        return { success: false, type: 'error', msg: `后台同步失败: ${msg}` };
      } else {
        this.status = 'error';
        this.errorMsg = msg;
        return { success: false, type: 'error', msg };
      }
    }
  }

  private applyRemoteData(content: NavData, sha: string) {
    this.data = Validation.navData(content);
    this.finalizeSync(sha);
  }

  async sync(): Promise<OpResult> {
    if (!this.isDirty) return { success: true };
    this.isSyncing = true;
    
    try {
      const newSha = await pushNav(this.config, this.data, this.lastSha);
      this.finalizeSync(newSha);
      return { success: true, msg: '同步成功' };
    } catch (e: any) {
      if (e.code === 'CONFLICT' || e.message === 'CONFLICT') {
        return { success: false, type: 'conflict', msg: '云端版本冲突' };
      }
      return { success: false, type: 'error', msg: resolveError(e) };
    } finally {
      this.isSyncing = false;
    }
  }

  async forceSync(): Promise<OpResult> {
    this.isSyncing = true;
    try {
      const { sha } = await getRemoteInfo(this.config);
      const newSha = await pushNav(this.config, this.data, sha);
      this.finalizeSync(newSha);
      return { success: true, msg: '强制覆盖成功' };
    } catch (e) {
      return { success: false, type: 'error', msg: resolveError(e) };
    } finally {
      this.isSyncing = false;
    }
  }

  async updateConfig(cfg: GithubConfig): Promise<OpResult> {
    const check = Validation.config(cfg);
    if (!check.valid) return { success: false, type: 'error', msg: check.error || '配置无效' };

    this.config = cfg;
    storage.saveConfig(cfg);
    return await this.init();
  }

  async reset() {
    this.isDirty = false;
    storage.setDirty(false);
    this.status = 'syncing';
    return await this.init(); 
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

  applyServerData(content: NavData, sha: string) {
    this.applyRemoteData(content, sha);
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
      this.data = Validation.navData(json);
      this.markDirty();
    } catch (e) {
      throw new Error('导入文件格式错误');
    }
  }
}

export const nav = new NavState();