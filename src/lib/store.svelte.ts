import { getRemoteInfo, pushNav } from './github';
import { storage } from './utils';
import type { NavData, GithubConfig, Group, Site, ToastState } from './types';

class AppState {
  // =========================================
  // State (状态源)
  // =========================================
  config = $state<GithubConfig>({ owner: '', repo: '', token: '' });
  data = $state<NavData>({ groups: [] });
  lastSha = $state('');
  
  status = $state<'init' | 'ready' | 'syncing' | 'error'>('init');
  errorMsg = $state('');
  
  // UI 状态
  isEdit = $state(false);
  isDirty = $state(false);
  isDark = $state(false);
  isSyncing = $state(false);
  
  // 交互反馈状态
  toast = $state<ToastState | null>(null);
  confirmPayload = $state<{ msg: string; onConfirm: () => void } | null>(null);
  
  private toastTimer: number | null = null;

  // =========================================
  // Lifecycle & Init (初始化)
  // =========================================
  constructor() {
    this.loadLocal();
    this.setupStorageListener();
  }

  private loadLocal() {
    this.config = storage.getConfig();
    this.data = storage.getData();
    this.lastSha = storage.getSha();
    this.isDirty = storage.getDirty();
    
    const t = storage.getTheme();
    this.isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.applyTheme();
    
    if (this.isDirty) {
      this.isEdit = false; 
    }
  }

  private setupStorageListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (e) => {
      if (e.key === storage.KEYS.DATA && e.newValue) {
        try { this.data = JSON.parse(e.newValue); } catch {}
      }
      if (e.key === storage.KEYS.SHA && e.newValue) this.lastSha = e.newValue;
      if (e.key === storage.KEYS.DIRTY && e.newValue) this.isDirty = e.newValue === 'true';
    });
  }

  async init() {
    if (!this.config.token) {
      this.status = 'ready';
      return;
    }

    if (this.isDirty) {
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
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      
      if (this.data.groups.length > 0) {
        this.status = 'ready';
        this.showToast(`同步失败: ${err.message}`, 'error');
      } else {
        this.status = 'error';
        this.errorMsg = err.message;
        throw err;
      }
    }
  }

  // =========================================
  // GitHub Sync (云端同步)
  // =========================================
  async sync() {
    if (!this.isDirty) return;
    this.isSyncing = true;
    
    try {
      const newSha = await pushNav(this.config, this.data, this.lastSha);
      this.lastSha = newSha;
      this.isDirty = false;
      this.saveAll();
      this.isSyncing = false;
      this.showToast('同步成功', 'success');
    } catch (e: unknown) {
      this.isSyncing = false;
      const err = e instanceof Error ? e : new Error(String(e));

      if (err.message === 'CONFLICT') {
        this.handleConflict();
      } else {
        this.showToast(err.message, 'error');
      }
    }
  }

  private handleConflict() {
    const force = window.confirm('检测到云端数据已更新（版本冲突）。\n\n点击【确定】强制用当前本地数据覆盖云端（推荐）。\n点击【取消】刷新页面（本地修改将丢失）。');
    
    if (force) {
      this.forcePush();
    } else {
      location.reload();
    }
  }

  private async forcePush() {
    this.isSyncing = true;
    try {
      this.showToast('正在强制覆盖...', 'info');
      const remote = await getRemoteInfo(this.config);
      const newSha = await pushNav(this.config, this.data, remote.sha);
      this.lastSha = newSha;
      this.isDirty = false;
      this.saveAll();
      this.showToast('覆盖成功！', 'success');
    } catch (e: unknown) {
       const err = e instanceof Error ? e : new Error(String(e));
       this.showToast('覆盖失败: ' + err.message, 'error');
    } finally {
       this.isSyncing = false;
    }
  }

  async reset() {
    this.isEdit = false;
    this.isDirty = false;
    storage.setDirty(false);
    this.status = 'syncing';
    try {
      await this.init();
      this.showToast('已重置为云端版本', 'success');
    } catch (e: unknown) {
      this.showToast('重置失败：无法连接 GitHub', 'error');
      this.isDirty = true; 
      this.isEdit = true;
    }
  }

  async updateConfig(cfg: GithubConfig) {
    this.config = cfg;
    storage.saveConfig(cfg);
    await this.init();
  }

  private saveAll() {
    storage.saveData(this.data);
    storage.saveSha(this.lastSha);
    storage.setDirty(this.isDirty);
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
    this.showToast('备份已下载', 'success');
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
        const json = JSON.parse(text) as unknown;

        if (!this.isValidNavData(json)) {
            throw new Error('格式错误');
        }

        const safeGroups = json.groups.map((g) => ({
          id: g.id || crypto.randomUUID(),
          name: g.name || '未命名',
          sites: Array.isArray(g.sites) ? g.sites.map((s) => ({
             id: s.id || crypto.randomUUID(),
             name: s.name || '未命名',
             url: /^https?:\/\//i.test(s.url || '') ? s.url : '',
             icon: s.icon || ''
          })).filter((s) => s.url) : []
        }));

        this.openConfirm('确定要覆盖当前所有数据吗？此操作不可撤销。', () => {
             this.data = { groups: safeGroups };
             this.markDirty();
             this.showToast('数据已恢复，请记得同步', 'success');
        });
      } catch (e: unknown) {
        this.showToast('无效的备份文件', 'error');
      }
    };
    input.click();
  }

  // =========================================
  // Data Mutations (数据操作)
  // =========================================
  private markDirty() {
    this.isDirty = true;
    storage.saveData(this.data);
    storage.setDirty(true);
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

  moveSite(siteId: string, fromGroupId: string, toGroupId: string, newIndex: number) {
    const fromGroup = this.data.groups.find(g => g.id === fromGroupId);
    const toGroup = this.data.groups.find(g => g.id === toGroupId);
    
    if (!fromGroup || !toGroup) return;

    const siteIndex = fromGroup.sites.findIndex(s => s.id === siteId);
    if (siteIndex === -1) return;

    const [site] = fromGroup.sites.splice(siteIndex, 1);
    toGroup.sites.splice(newIndex, 0, site);
    
    this.markDirty();
  }

  updateSites(groupId: string, sites: Site[]) {
    const g = this.data.groups.find(x => x.id === groupId);
    if (g) { g.sites = sites; this.markDirty(); }
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

  // =========================================
  // UI Effects & Helpers (界面交互)
  // =========================================
  toggleTheme() {
    this.isDark = !this.isDark;
    storage.saveTheme(this.isDark);
    this.applyTheme();
  }

  applyTheme() {
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', this.isDark);
    }
  }

  toggleEdit() { this.isEdit = !this.isEdit; }

  showToast(msg: string, type: 'info' | 'error' | 'success') {
    this.toast = { msg, type };
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast = null;
      this.toastTimer = null;
    }, 5000);
  }
  
  openConfirm(msg: string, onConfirm: () => void) { this.confirmPayload = { msg, onConfirm }; }
  closeConfirm() { this.confirmPayload = null; }

  // Type Guard
  private isValidNavData(data: unknown): data is NavData {
      if (typeof data !== 'object' || data === null) return false;
      return 'groups' in data && Array.isArray((data as NavData).groups);
  }
}

export const app = new AppState();