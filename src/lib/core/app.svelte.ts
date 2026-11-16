import { flushSync } from 'svelte';
import { on } from 'svelte/events';
import { online } from 'svelte/reactivity/window';
import { DEFAULT_ENGINE_ID, SEARCH_ENGINES } from '../config/search';
import { APP_TIMEOUTS } from '../constants';
import { storage } from '../infra/storage';
import { prefersReducedMotion } from '../utils';

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
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  currentEngineId = $state(
    storage.engine && SEARCH_ENGINES[storage.engine] ? storage.engine : DEFAULT_ENGINE_ID
  );

  constructor() {
    const isZh = navigator.language.toLowerCase().startsWith('zh');
    document.documentElement.lang = isZh ? 'zh-CN' : 'en';

    $effect.root(() => {
      $effect(() =>
        on(window.matchMedia('(prefers-color-scheme: dark)'), 'change', (e) => {
          if (!storage.theme) this.isDark = e.matches;
        })
      );

      $effect(() => {
        document.documentElement.classList.toggle('dark', this.isDark);
      });
    });
  }

  toggleTheme = () => {
    const next = !this.isDark;
    storage.theme = next ? 'dark' : 'light';

    if (prefersReducedMotion.current) {
      this.isDark = next;
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        this.isDark = next;
      });
    });
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
    clearTimeout(this.toastTimer);
    this.toast = { msg, type };
    this.toastTimer = setTimeout(() => {
      this.toast = null;
    }, APP_TIMEOUTS.TOAST_DURATION);
  };

  setEngine = (id: string) => {
    this.currentEngineId = id;
    storage.engine = id;
  };
}

export const appState = new AppCore();
