import { storage } from '../infra/storage';
import { tick } from 'svelte';

type ToastType = 'info' | 'success' | 'error';

interface ToastState {
  id: number;
  msg: string;
  type: ToastType;
}

interface ConfirmPayload {
  msg: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

type ModalType = 'config' | 'site' | 'group' | 'confirm' | null;

class AppCore {
  isDark = $state(storage.theme === 'dark' || (!storage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches));

  isEditMode = $state(false);
  
  activeModal = $state<ModalType>(null);
  editingGroupId = $state<string | undefined>(undefined);
  editingSiteId = $state<string | undefined>(undefined);
  confirmPayload = $state<ConfirmPayload | null>(null);

  toast = $state<ToastState | null>(null);
  private toastTimer: number | null = null;

  constructor() {
  }

  init() {
    $effect(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', this.isDark);
        storage.theme = this.isDark ? 'dark' : 'light';
      }
    });
  }

  toggleTheme = async (e: MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    const transition = document.startViewTransition(async () => {
      this.isDark = !this.isDark;
      await tick();
    });

    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 300,
        easing: 'ease-in',
        pseudoElement: '::view-transition-new(root)'
      }
    );
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
    this.toast = { id: Date.now(), msg, type };
    this.toastTimer = window.setTimeout(() => {
      this.toast = null;
    }, 3000);
  };
}

export const appState = new AppCore();