import { tick } from 'svelte';
import { APP_TIMEOUTS } from '../constants';
import { storage } from '../infra/storage';

type ToastType = 'info' | 'success' | 'error';

interface ToastState {
  msg: string;
  type: ToastType;
}

interface ConfirmPayload {
  msg: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

type ModalType = 'config' | 'site' | 'group' | 'confirm' | null;

interface TooltipState {
  visible: boolean;
  msg: string;
  anchorName: string;
}

class AppCore {
  isDark = $state(
    storage.theme === 'dark' ||
      (!storage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  isOnline = $state(navigator.onLine);

  isEditMode = $state(false);

  activeModal = $state<ModalType>(null);
  editingGroupId = $state<string | undefined>(undefined);
  editingSiteId = $state<string | undefined>(undefined);
  confirmPayload = $state<ConfirmPayload | null>(null);

  toast = $state<ToastState | null>(null);
  private toastTimer: number | null = null;

  tooltip = $state<TooltipState | null>(null);

  visibleGroupIds = $state<string[]>([]);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  init() {
    $effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark);
      storage.theme = this.isDark ? 'dark' : 'light';
    });
  }

  toggleTheme = async () => {
    if (!document.startViewTransition) {
      this.isDark = !this.isDark;
      await tick();
      return;
    }

    const transition = document.startViewTransition(async () => {
      this.isDark = !this.isDark;
      await tick();
    });
    await transition.finished;
  };

  toggleEditMode = () => {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.closeModal();
    }
  };

  openConfig = () => {
    this.activeModal = 'config';
  };

  openGroupModal = (groupId?: string) => {
    this.editingGroupId = groupId;
    this.activeModal = 'group';
  };

  openSiteModal = (groupId: string, siteId?: string) => {
    this.editingGroupId = groupId;
    this.editingSiteId = siteId;
    this.activeModal = 'site';
  };

  openConfirm = (payload: ConfirmPayload) => {
    this.confirmPayload = payload;
    this.activeModal = 'confirm';
  };

  closeModal = () => {
    this.activeModal = null;
    this.editingGroupId = undefined;
    this.editingSiteId = undefined;
    this.confirmPayload = null;
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

  hideTooltip = () => {
    if (this.tooltip) {
      this.tooltip.visible = false;
    }
  };

  updateTooltip = (msg: string, anchorName: string) => {
    if (this.tooltip?.visible) {
      this.tooltip = { visible: true, msg, anchorName };
    }
  };
}

export const appState = new AppCore();
