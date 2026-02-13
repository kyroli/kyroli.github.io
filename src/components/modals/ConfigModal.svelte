<script lang="ts">
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { sync } from '$lib/services/sync';
  import { manager } from '$lib/services/manager';
  import { GithubClient } from '$lib/infra/github';
  import { MESSAGES } from '$lib/i18n';
  import Modal from '../ui/Modal.svelte';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let { onClose } = $props<{ onClose: () => void }>();
  
  let repoPath = $state(dataState.config.owner ? `${dataState.config.owner}/${dataState.config.repo}` : '');
  let token = $state(dataState.config.token);
  let isSaving = $state(false);
  
  let globalError = $state('');

  const saveBtnText = $derived(isSaving ? MESSAGES.UI.WAITING : MESSAGES.UI.SAVE_AND_SYNC);

  async function handleSave() {
    globalError = '';
    if (!repoPath || !token) { 
      globalError = MESSAGES.TOAST.CONFIG_INCOMPLETE; 
      return;
    }

    try {
      const { owner, repo } = GithubClient.parseRepoPath(repoPath);
      isSaving = true;
      
      await sync.updateConfig({ 
        owner, 
        repo, 
        token: token.trim() 
      });

      if (dataState.syncStatus === 'error') {
         globalError = dataState.syncError || MESSAGES.TOAST.UNKNOWN_ERROR;
      } else {
         appState.showToast(MESSAGES.TOAST.CONFIG_SAVED, 'success');
         if (appState.activeModal === 'config') {
            onClose();
         }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'Invalid repository format') {
         globalError = MESSAGES.TOAST.CONFIG_FORMAT_ERROR;
      } else {
         globalError = e instanceof Error ? e.message : MESSAGES.TOAST.UNKNOWN_ERROR;
      }
    } finally {
      isSaving = false;
    }
  }

  function handleExport() {
      manager.exportData();
      appState.showToast(MESSAGES.TOAST.BACKUP_DOWNLOADED, 'success');
  }

  function handleFileImport(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      appState.openConfirm({
        msg: MESSAGES.CONFIRM.RESTORE,
        onConfirm: async () => {
             try {
                await manager.importData(file);
                appState.showToast(MESSAGES.TOAST.RESTORE_SUCCESS, 'success');
             } catch (err: unknown) {
                const message = err instanceof Error ? err.message : MESSAGES.TOAST.IMPORT_FAIL_FORMAT;
                appState.showToast(message, 'error');
             }
        },
        isDestructive: true
      });
      input.value = '';
    }
  }

  const errorBannerClass = "bg-danger/10 border border-danger/20 rounded-lg p-3 text-danger text-xs font-bold animate-fade";
  const footerClass = "mt-6 pt-5 border-t border-border/40 flex items-center justify-center text-xs text-text-dim/60";
  const actionBtnClass = "hover:text-primary transition-colors cursor-pointer";
</script>

<Modal {onClose} title={MESSAGES.MODAL.CONFIG_TITLE}>
  {#if globalError}
    <div class={errorBannerClass}>⚠️ {globalError}</div>
  {/if}

  <div class="space-y-4">
    <Input 
      id="repo" 
      label={MESSAGES.MODAL.CONFIG_LABEL_REPO}
      bind:value={repoPath} 
      placeholder={MESSAGES.MODAL.CONFIG_PLACEHOLDER_REPO} 
      oninput={() => globalError = ''} 
      onkeydown={(e) => e.key === 'Enter' && handleSave()}
    />
    
    <Input 
      id="token" 
      label={MESSAGES.MODAL.CONFIG_LABEL_TOKEN}
      bind:value={token} 
      type="password" 
      placeholder={MESSAGES.MODAL.CONFIG_PLACEHOLDER_TOKEN} 
      oninput={() => globalError = ''} 
      class="tracking-widest" 
      onkeydown={(e) => e.key === 'Enter' && handleSave()}
    />
  </div>
   
  <Button onclick={handleSave} disabled={isSaving} class="py-3.5 mt-2">
    {saveBtnText}
  </Button>

  <div class={footerClass}>
    <div class="flex gap-4">
      <button onclick={handleExport} class={actionBtnClass} title={MESSAGES.MODAL.EXPORT_TITLE}>{MESSAGES.MODAL.EXPORT_DATA}</button>
      <span class="opacity-30">|</span>
      
      <label class={actionBtnClass} title={MESSAGES.MODAL.IMPORT_TITLE}>
        {MESSAGES.MODAL.IMPORT_DATA}
        <input type="file" accept=".json" class="hidden" onchange={handleFileImport} />
      </label>
    </div>
  </div>
</Modal>