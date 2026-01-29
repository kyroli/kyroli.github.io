import { storage } from './utils';
import type { ToastState } from './types';

class UIState {
  isDark = $state(false);
  isEdit = $state(false);
  
  toast = $state<ToastState | null>(null);
  confirmPayload = $state<{ msg: string; onConfirm: () => void } | null>(null);
  
  editingSite = $state<{ groupId: string; siteId?: string } | null>(null);
  
  private toastTimer: number | null = null;

  constructor() {
    const t = storage.getTheme();
    this.isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.applyTheme();
  }

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

  toggleEdit() {
    this.isEdit = !this.isEdit;
  }

  openSiteModal(groupId: string, siteId?: string) {
    this.editingSite = { groupId, siteId };
  }

  closeSiteModal() {
    this.editingSite = null;
  }

  showToast(msg: string, type: 'info' | 'error' | 'success') {
    this.toast = { msg, type };
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast = null;
      this.toastTimer = null;
    }, 5000);
  }

  openConfirm(msg: string, onConfirm: () => void) {
    this.confirmPayload = { msg, onConfirm };
  }

  closeConfirm() {
    this.confirmPayload = null;
  }
}

export const ui = new UIState();