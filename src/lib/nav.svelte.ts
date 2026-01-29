import { getRemoteInfo, pushNav } from './github';
import { storage, resolveError } from './utils';
import { ui } from './ui.svelte';
import type { NavData, GithubConfig, Group, Site } from './types';

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
    this.data = storage.getData();
    this.lastSha = storage.getSha();
    this.isDirty = storage.getDirty();
  }

  private handleStorageChange(e: StorageEvent) {
    if (e.key === storage.KEYS.DATA && e.newValue) {
      try { this.data = JSON.parse(e.newValue); } catch {}
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
      this.data = content;
      this.lastSha = sha;
      this.isDirty = false;
      this.saveAll();
      this.status = 'ready';
    } catch (e) {
      const msg = resolveError(e);
      if (this.data.groups.length > 0) {
        this.status = 'ready';
        ui.showToast(`同步失败: ${msg}`, 'error');
      } else {
        this.status = 'error';
        this.errorMsg = msg;
      }
    }
  }

  async sync() {
    if (!this.isDirty) return;
    this.isSyncing = true;
    
    try {
      const newSha = await pushNav(this.config, this.data, this.lastSha);
      this.lastSha = newSha;
      this.isDirty = false;
      this.saveAll();
      ui.showToast('同步成功', 'success');
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (err.message === 'CONFLICT') {
        ui.openConfirm('云端数据已更新（版本冲突）。\n确定强制覆盖云端吗？（取消则请手动刷新页面）', () => {
          this.forcePush();
        });
      } else {
        ui.showToast(resolveError(err), 'error');
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async forcePush() {
    this.isSyncing = true;
    try {
      const remote = await getRemoteInfo(this.config);
      const newSha = await pushNav(this.config, this.data, remote.sha);
      this.lastSha = newSha;
      this.isDirty = false;
      this.saveAll();
      ui.showToast('覆盖成功', 'success');
    } catch (e) {
      ui.showToast('覆盖失败: ' + resolveError(e), 'error');
    } finally {
      this.isSyncing = false;
    }
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
    try {
      await this.init();
      ui.showToast('已重置为云端版本', 'success');
    } catch (e) {
      ui.showToast('重置失败', 'error');
      this.isDirty = true;
    }
  }

  // --- CRUD Operations ---

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
    this.data.groups = this.data.groups.filter(g => g.id !== groupId);
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
    if (g) { g.sites = g.sites.filter(s => s.id !== siteId); this.markDirty(); }
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
    ui.showToast('备份已下载', 'success');
  }

  importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        
        // 简化的校验，实际使用中可以更严格
        if (!json || !Array.isArray(json.groups)) throw new Error();

        ui.openConfirm('确定要覆盖当前所有数据吗？此操作不可撤销。', () => {
             this.data = json as NavData;
             this.markDirty();
             ui.showToast('数据已恢复，请记得同步', 'success');
        });
      } catch {
        ui.showToast('无效的备份文件', 'error');
      }
    };
    input.click();
  }
}

export const nav = new NavState();