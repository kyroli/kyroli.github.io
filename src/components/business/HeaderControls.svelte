<script lang="ts">
import { untrack } from 'svelte';
import { fade } from 'svelte/transition';
import { tooltip } from '$lib/actions/tooltip.svelte';
import { ANIMATION_SPEED } from '$lib/constants';
import { appState } from '$lib/core/app.svelte';
import { dataState } from '$lib/core/data.svelte';
import { MESSAGES } from '$lib/i18n';
import { sync } from '$lib/services/sync';
import Button from '../ui/Button.svelte';
import Icon, { type IconName } from '../ui/Icon.svelte';
import ThemeSwitch from './ThemeSwitch.svelte';

const isSyncing = $derived(
  dataState.syncStatus === 'syncing' || dataState.syncStatus === 'checking'
);
const syncStatusConfig = $derived.by<{ icon: IconName; color: string; title: string }>(() => {
  if (!appState.isOnline)
    return { icon: 'wifi-off', color: 'text-text-dim', title: MESSAGES.UI.STATUS_OFFLINE };
  if (!dataState.hasToken)
    return { icon: 'cloud-off', color: 'text-text-dim/30', title: MESSAGES.UI.STATUS_NO_CONFIG };
  if (dataState.syncStatus === 'error' || dataState.syncStatus === 'conflict')
    return { icon: 'cloud-alert', color: 'text-danger', title: MESSAGES.UI.STATUS_SYNC_ERROR };
  if (isSyncing)
    return {
      icon: 'loader',
      color: 'text-primary motion-safe:animate-spin motion-reduce:animate-[spin_6s_linear_infinite]',
      title: MESSAGES.UI.STATUS_SYNCING
    };
  if (dataState.isDirty)
    return { icon: 'cloud', color: 'text-primary', title: MESSAGES.UI.STATUS_UNSAVED };
  return { icon: 'check', color: 'text-text-dim/50', title: MESSAGES.UI.STATUS_SAVED };
});

const isErrorStatus = $derived(
  dataState.syncStatus === 'conflict' || dataState.syncStatus === 'error'
);

const canClickStatus = $derived(
  appState.isOnline &&
    dataState.hasToken &&
    (isErrorStatus || (dataState.isDirty && !isSyncing))
);

function openConflictConfirm() {
  appState.openConfirm({
    msg: MESSAGES.CONFIRM.CONFLICT_FORCE,
    onConfirm: handleForcePush
  });
}

function handleStatusClick() {
  if (dataState.syncStatus === 'conflict') {
    openConflictConfirm();
  } else if (dataState.syncStatus === 'error') {
    sync.init();
  } else if (dataState.isDirty) {
    handleSync();
  }
}

$effect(() => {
  if (dataState.syncStatus === 'conflict') {
    openConflictConfirm();
  }
});

let wasOnline = appState.isOnline;
$effect(() => {
  const online = appState.isOnline;
  if (online && !wasOnline) {
    untrack(() => {
      if (dataState.hasToken && dataState.syncStatus === 'error') {
        sync.init();
      }
    });
  }
  wasOnline = online;
});

function getSafeErrorMessage(e: unknown): string {
  if (dataState.syncError) return dataState.syncError;
  if (e instanceof Error) return e.message;
  return MESSAGES.ERRORS.UNKNOWN;
}

async function handleForcePush() {
  try {
    await sync.forcePush();
    if (dataState.syncStatus === 'success') {
      appState.showToast(MESSAGES.TOAST.FORCE_PUSH_SUCCESS, 'success');
    }
  } catch (e: unknown) {
    const msg = getSafeErrorMessage(e);
    appState.showToast(`${MESSAGES.TOAST.FORCE_PUSH_FAIL}: ${msg}`, 'error');
  }
}

function handleEditClick() {
  if (!dataState.hasToken) {
    appState.showToast(MESSAGES.TOAST.CONFIG_MISSING, 'error');
    return;
  }
  appState.toggleEditMode();
}

async function handleSync() {
  try {
    await sync.push();
    if (dataState.syncStatus === 'success') {
      if (appState.isEditMode) {
        appState.toggleEditMode();
      }
      appState.showToast(MESSAGES.TOAST.SYNC_SUCCESS, 'success');
    }
  } catch (e: unknown) {
    const msg = getSafeErrorMessage(e);
    appState.showToast(`${MESSAGES.TOAST.SYNC_FAIL_PREFIX}${msg}`, 'error');
  }
}

function handleReset() {
  appState.openConfirm({
    msg: MESSAGES.CONFIRM.DISCARD_CHANGES,
    onConfirm: async () => {
      try {
        await sync.resetToRemote();
        if (dataState.syncStatus === 'success') {
          appState.toggleEditMode();
          appState.showToast(MESSAGES.TOAST.RESET_SUCCESS, 'success');
        }
      } catch (e: unknown) {
        appState.showToast(getSafeErrorMessage(e), 'error');
      }
    },
    isDestructive: true
  });
}
</script>

<div class="justify-self-end flex items-center justify-end">
  <div class="flex items-center gap-3 h-10">
    {#if canClickStatus}
      <button
        type="button"
        onclick={handleStatusClick}
        class={[
          'flex items-center justify-center w-8 h-8 rounded-full bg-surface border transition-colors cursor-pointer active-press-icon',
          isErrorStatus ? 'border-danger/40 hover:border-danger' : 'border-primary/40 hover:border-primary'
        ]}
        {@attach tooltip(syncStatusConfig.title)}
      >
        <Icon name={syncStatusConfig.icon} class={['w-4 h-4', syncStatusConfig.color]} />
      </button>
    {:else}
      <div
        role="img"
        aria-label={syncStatusConfig.title}
        class="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border/50"
        {@attach tooltip(syncStatusConfig.title)}
      >
        <Icon name={syncStatusConfig.icon} class={['w-4 h-4', syncStatusConfig.color]} />
      </div>
    {/if}

    <div class="grid">
      {#if appState.isEditMode}
        <div transition:fade={{ duration: ANIMATION_SPEED.FADE_NORMAL }} class="col-start-1 row-start-1 flex gap-3 items-center">
          <Button variant="outline" size="icon" onclick={appState.toggleEditMode} title={MESSAGES.UI.TIP_EXIT_EDIT} class="tap-target">
            <Icon name="x" class="w-5 h-5" />
          </Button>

          <Button variant="primary" size="icon" onclick={handleSync} title={isSyncing ? MESSAGES.UI.SYNCING : MESSAGES.UI.SAVE_AND_SYNC} disabled={!dataState.isDirty || isSyncing} class="tap-target">
            {#if isSyncing}
              <Icon name="loader" class="w-5 h-5 motion-safe:animate-spin motion-reduce:animate-[spin_6s_linear_infinite]" />
            {:else}
              <Icon name="save" class="w-5 h-5" />
            {/if}
          </Button>

          <Button variant="danger" size="icon" onclick={handleReset} title={MESSAGES.UI.RESET} disabled={!dataState.isDirty || isSyncing} class="tap-target">
            <Icon name="rotate-ccw" class="w-5 h-5" />
          </Button>
        </div>
      {:else}
        <div transition:fade={{ duration: ANIMATION_SPEED.FADE_NORMAL }} class="col-start-1 row-start-1 flex gap-3 items-center">
          <ThemeSwitch />
          
          <Button variant="outline" size="icon" onclick={handleEditClick} title={MESSAGES.UI.TIP_ENTER_EDIT} class="tap-target">
            <Icon name="pencil" class="w-5 h-5" />
          </Button>

          <div class="relative">
            <Button variant="outline" size="icon" onclick={appState.openConfig} title={!dataState.hasToken ? MESSAGES.UI.TIP_CONFIG_TOKEN : MESSAGES.MODAL.CONFIG_TITLE} class="tap-target">
               <Icon name="settings" class="w-5 h-5" />
            </Button>
            {#if !dataState.hasToken}
              <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary motion-safe:animate-pulse pointer-events-none"></span>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>