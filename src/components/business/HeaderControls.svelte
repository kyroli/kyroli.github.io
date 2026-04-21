<script lang="ts">
  import { fade } from 'svelte/transition';
  import { X, Save, RotateCcw, Pencil, Settings, Loader2, Cloud, CloudOff, CloudAlert, Check, WifiOff } from 'lucide-svelte';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { sync } from '$lib/services/sync';
  import { MESSAGES } from '$lib/i18n';
  import { ANIMATION_SPEED } from '$lib/constants';
  import Button from '../ui/Button.svelte';
  import ThemeSwitch from '../ui/ThemeSwitch.svelte';
  import { tooltip } from '$lib/actions/tooltip';

  const isSyncing = $derived(dataState.syncStatus === 'syncing' || dataState.syncStatus === 'checking');
  const syncStatusConfig = $derived.by(() => {
    if (!appState.isOnline) return { icon: WifiOff, color: 'text-text-dim', title: MESSAGES.UI.STATUS_OFFLINE };
    if (!dataState.hasToken) return { icon: CloudOff, color: 'text-text-dim/30', title: MESSAGES.UI.STATUS_NO_CONFIG };
    if (dataState.syncStatus === 'error' || dataState.syncStatus === 'conflict') return { icon: CloudAlert, color: 'text-danger', title: MESSAGES.UI.STATUS_SYNC_ERROR };
    if (isSyncing) return { icon: Loader2, color: 'text-primary animate-spin', title: MESSAGES.UI.STATUS_SYNCING };
    if (dataState.isDirty) return { icon: Cloud, color: 'text-primary', title: MESSAGES.UI.STATUS_UNSAVED };
    return { icon: Check, color: 'text-text-dim/50', title: MESSAGES.UI.STATUS_SAVED };
  });

  const StatusIcon = $derived(syncStatusConfig.icon);

  $effect(() => {
    if (dataState.syncStatus === 'conflict') {
       appState.openConfirm({
          msg: MESSAGES.CONFIRM.CONFLICT_FORCE,
          onConfirm: handleForcePush
       });
    }
  });

  function getSafeErrorMessage(e: unknown): string {
    if (dataState.syncError) return dataState.syncError;
    if (e instanceof Error) return e.message;
    return MESSAGES.ERRORS.UNKNOWN;
  }

  async function handleForcePush() {
    try {
      await sync.forcePush();
      appState.showToast(MESSAGES.TOAST.FORCE_PUSH_SUCCESS, 'success');
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
  
  function handleSync() {
    appState.openConfirm({
      msg: MESSAGES.CONFIRM.SYNC_CHANGES,
      onConfirm: async () => {
        appState.toggleEditMode();
        try {
          await sync.push();
          if (dataState.syncStatus === 'success') {
             appState.showToast(MESSAGES.TOAST.SYNC_SUCCESS, 'success');
          }
        } catch (e: unknown) {
           const msg = getSafeErrorMessage(e);
           appState.showToast(`${MESSAGES.TOAST.SYNC_FAIL_PREFIX}${msg}`, 'error');
        }
      }
    });
  }

  function handleReset() {
    appState.openConfirm({
      msg: MESSAGES.CONFIRM.DISCARD_CHANGES,
      onConfirm: async () => {
        try {
          await sync.resetToRemote();
          appState.toggleEditMode();
          appState.showToast(MESSAGES.TOAST.RESET_SUCCESS, 'success');
        } catch (e: unknown) {
          appState.showToast(MESSAGES.TOAST.RESET_FAIL, 'error');
        }
      },
      isDestructive: true
    });
  }
</script>

<div class="justify-self-end flex items-center justify-end">
  <div class="flex items-center gap-3 h-10">
    <div class="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border/50" use:tooltip={syncStatusConfig.title}>
      <StatusIcon class={`w-4 h-4 ${syncStatusConfig.color}`} />
    </div>

    <div class="grid">
      {#if appState.isEditMode}
        <div transition:fade={{ duration: ANIMATION_SPEED.FADE_NORMAL }} class="col-start-1 row-start-1 flex gap-3 items-center">
          <Button variant="outline" size="icon" onclick={appState.toggleEditMode} title={MESSAGES.UI.TIP_EXIT_EDIT}>
            <X class="w-5 h-5" />
          </Button>

          <Button variant="primary" size="icon" onclick={handleSync} title={isSyncing ? MESSAGES.UI.SYNCING : MESSAGES.UI.SAVE_AND_SYNC} disabled={!dataState.isDirty || isSyncing}>
            {#if isSyncing}
              <Loader2 class="w-5 h-5 animate-spin" />
            {:else}
              <Save class="w-5 h-5" />
            {/if}
          </Button>

          <Button variant="danger" size="icon" onclick={handleReset} title={MESSAGES.UI.RESET}>
            <RotateCcw class="w-5 h-5" />
          </Button>
        </div>
      {:else}
        <div transition:fade={{ duration: ANIMATION_SPEED.FADE_NORMAL }} class="col-start-1 row-start-1 flex gap-3 items-center">
          <ThemeSwitch />
          
          <div class="relative">
            <Button variant="outline" size="icon" onclick={handleEditClick} title={MESSAGES.UI.TIP_ENTER_EDIT}>
              <Pencil class="w-5 h-5" />
            </Button>
          </div>

          <div class="relative">
            <Button variant="outline" size="icon" onclick={appState.openConfig} title={!dataState.hasToken ? MESSAGES.UI.TIP_CONFIG_TOKEN : MESSAGES.MODAL.CONFIG_TITLE}>
               <Settings class={`w-5 h-5 ${!dataState.hasToken ? 'text-text-dim' : ''}`} />
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>