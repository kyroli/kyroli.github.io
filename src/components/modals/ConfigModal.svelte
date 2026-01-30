<script lang="ts">
  import { nav } from '$lib/nav.svelte';
  import { ui } from '$lib/ui.svelte';
  import { resolveError } from '$lib/utils';
  import { MESSAGES } from '$lib/i18n';
  import Modal from '../ui/Modal.svelte';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let { onClose } = $props<{ onClose: () => void }>();
  let repoPath = $state(nav.config.owner ? `${nav.config.owner}/${nav.config.repo}` : '');
  let token = $state(nav.config.token);
  let isSaving = $state(false);
  let errorMsg = $state('');
  const saveBtnText = $derived(isSaving ? MESSAGES.UI.WAITING : MESSAGES.UI.SAVE_AND_SYNC);

  async function handleSave() {
    errorMsg = '';
    if (!repoPath || !token) { 
      errorMsg = MESSAGES.TOAST.CONFIG_INCOMPLETE; 
      return;
    }

    const parts = repoPath.split('/');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      errorMsg = MESSAGES.TOAST.CONFIG_FORMAT_ERROR;
      return;
    }
    
    isSaving = true;
    try {
      const res = await nav.updateConfig({ owner: parts[0].trim(), repo: parts[1].trim(), token: token.trim() });
      onClose();
      ui.showToast(MESSAGES.TOAST.CONFIG_SAVED, 'success');
      
      if (res && res.type === 'conflict') {
         ui.openConfirm(
            `云端数据已有更新。${MESSAGES.CONFIRM.RESTORE}`,
            () => {
               nav.applyServerData(res.serverData, res.serverSha);
               ui.showToast(MESSAGES.TOAST.RESET_SUCCESS, 'success');
            }
         );
      }
    } catch (e: unknown) {
      errorMsg = resolveError(e);
    } finally {
      isSaving = false;
    }
  }

  const errorClass = "bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-600 dark:text-red-400 text-xs font-bold animate-fade";
  const labelClass = "text-xs font-bold text-text-dim tracking-wider ml-1";
  const footerClass = "mt-6 pt-5 border-t border-border/40 flex items-center justify-center text-xs text-text-dim/60";
  const actionBtnClass = "hover:text-primary transition-colors cursor-pointer";
</script>

<Modal {onClose} title={MESSAGES.MODAL.CONFIG_TITLE}>
  {#if errorMsg}
    <div class={errorClass}>⚠️ {errorMsg}</div>
  {/if}

  <div class="space-y-2">
    <label class={labelClass} for="repo">{MESSAGES.MODAL.CONFIG_LABEL_REPO}</label>
    <Input id="repo" bind:value={repoPath} placeholder="username/repo" oninput={() => errorMsg = ''} />
  </div>
  
  <div class="space-y-2">
    <label class={labelClass} for="token">{MESSAGES.MODAL.CONFIG_LABEL_TOKEN}</label>
    <Input id="token" bind:value={token} type="password" placeholder="ghp_..." oninput={() => errorMsg = ''} class="tracking-widest" />
  </div>
   
  <Button onclick={handleSave} disabled={isSaving} class="py-3.5 mt-2">
    {saveBtnText}
  </Button>

  <div class={footerClass}>
    <div class="flex gap-4">
      <button onclick={() => nav.exportBackup()} class={actionBtnClass} title={MESSAGES.MODAL.EXPORT_TITLE}>{MESSAGES.MODAL.EXPORT_DATA}</button>
      <span class="opacity-30">|</span>
      <button onclick={() => nav.importBackup()} class={actionBtnClass} title={MESSAGES.MODAL.IMPORT_TITLE}>{MESSAGES.MODAL.IMPORT_DATA}</button>
    </div>
  </div>
</Modal>