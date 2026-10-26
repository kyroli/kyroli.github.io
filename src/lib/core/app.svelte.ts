import { online } from 'svelte/reactivity/window';
import { DEFAULT_ENGINE_ID, SEARCH_ENGINES } from '../config/search';
import { APP_TIMEOUTS } from '../constants';
import { MESSAGES } from '../i18n';
import { storage } from '../infra/storage';

type ToastType = 'info' | 'success' | 'error';

interface ToastState {
  msg: string;
  type: ToastType;
}

export interface ConfirmPayload {
  msg: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export type ModalState =
  | { type: 'config' }
  | { type: 'group'; groupId?: string }
  | { type: 'site'; groupId: string; siteId?: string }
  | ({ type: 'confirm' } & ConfirmPayload)
  | null;

interface TooltipState {
  visible: boolean;
  msg: string;
  anchorName: string;
}

class AppCore {
  isDark = $state(
    document.documentElement.classList.contains('dark') ||
      storage.theme === 'dark' ||
      (!storage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  get isOnline() {
    return online.current ?? true;
  }

  isEditMode = $state(false);
  modal = $state<ModalState>(null);

  toast = $state<ToastState | null>(null);
  private toastTimer: number | null = null;

  tooltip = $state<TooltipState | null>(null);

  currentEngineId = $state(
    storage.engine && SEARCH_ENGINES[storage.engine] ? storage.engine : DEFAULT_ENGINE_ID
  );

  constructor() {
    const isZh = navigator.language.toLowerCase().startsWith('zh');
    document.documentElement.lang = isZh ? 'zh-CN' : 'en';

    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', MESSAGES.UI.DESCRIPTION);
    }

    $effect.root(() => {
      $effect(() => {
        document.documentElement.classList.toggle('dark', this.isDark);
        storage.theme = this.isDark ? 'dark' : 'light';
        this.updateThemeMeta(this.isDark);
      });
    });
  }

  private updateThemeMeta(isDark: boolean) {
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', isDark ? '#09090b' : '#ffffff');
    }
  }

  toggleTheme = () => {
    this.isDark = !this.isDark;
  };

  toggleEditMode = () => {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.closeModal();
    }
  };

  openConfig = () => {
    this.modal = { type: 'config' };
  };

  openGroupModal = (groupId?: string) => {
    this.modal = { type: 'group', groupId };
  };

  openSiteModal = (groupId: string, siteId?: string) => {
    this.modal = { type: 'site', groupId, siteId };
  };

  openConfirm = (payload: ConfirmPayload) => {
    this.modal = { type: 'confirm', ...payload };
  };

  closeModal = () => {
    this.modal = null;
  };

  showToast = (msg: string, type: ToastType = 'info') => {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { msg, type };
    this.toastTimer = window.setTimeout(() => {
      this.toast = null;
    }, APP_TIMEOUTS.TOAST_DURATION);
  };

  showTooltip = (msg: string, anchorName: string) => {
    this.tooltip = { visible: true, msg, anchorName };
  };

  hideTooltip = (anchorName?: string) => {
    if (this.tooltip && (!anchorName || this.tooltip.anchorName === anchorName)) {
      this.tooltip.visible = false;
    }
  };

  setEngine = (id: string) => {
    this.currentEngineId = id;
    storage.engine = id;
  };
}

export const appState = new AppCore();
