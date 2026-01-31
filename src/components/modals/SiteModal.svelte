<script lang="ts">
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { Trash2 } from 'lucide-svelte';
  import Modal from '../ui/Modal.svelte';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let { groupId, siteId, onClose } = $props<{ 
    groupId: string, 
    siteId?: string, 
    onClose: () => void 
  }>();

  const group = dataState.groups.find(g => g.id === groupId);
  const site = siteId ? group?.sites.find(s => s.id === siteId) : null;

  let name = $state(site?.name ?? '');
  let url = $state(site?.url ?? '');
  let icon = $state(site?.icon ?? '');
  
  const modalTitle = $derived(siteId ? MESSAGES.MODAL.SITE_TITLE_EDIT : MESSAGES.MODAL.SITE_TITLE_NEW);

  function handleSave() {
    try {
      const trimmedUrl = url?.trim();
      
      if (trimmedUrl) {
         new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
      } else {
        throw new Error(MESSAGES.TOAST.SITE_INFO_REQUIRED);
      }

      manager.saveSite(groupId, {
        id: siteId,
        name,
        url,
        icon
      });
      onClose();
    } catch (e: any) {
      appState.showToast(e.message || 'Invalid URL', 'error');
    }
  }

  function handleDelete() {
    if (!siteId) return;
    appState.openConfirm({
      msg: MESSAGES.CONFIRM.DELETE_SITE,
      onConfirm: () => {
        manager.deleteSite(groupId, siteId);
        onClose();
      },
      isDestructive: true
    });
  }
  
  const deleteBtnClass = "absolute top-6 right-6";
  const deleteIconBtnClass = "!p-2 !rounded-lg text-danger hover:bg-danger/10 !border-transparent";
</script>

<Modal {onClose} title={modalTitle}>
  {#if siteId}
    <div class={deleteBtnClass}>
      <Button variant="ghost" onclick={handleDelete} class={deleteIconBtnClass}>
        <Trash2 class="w-5 h-5" />
      </Button>
    </div>
  {/if}

  <div class="space-y-3">
    <Input bind:value={name} placeholder={MESSAGES.MODAL.SITE_NAME_PLACEHOLDER} />
    <Input bind:value={url} placeholder={MESSAGES.MODAL.SITE_URL_PLACEHOLDER} />
    <Input bind:value={icon} placeholder={MESSAGES.MODAL.SITE_ICON_PLACEHOLDER} />
    
    <div class="flex gap-2 pt-4">
      <Button variant="ghost" onclick={onClose} class="flex-1 font-bold text-text-dim">{MESSAGES.UI.CANCEL}</Button>
      <Button onclick={handleSave} class="flex-1">{MESSAGES.UI.COMPLETE}</Button>
    </div>
  </div>
</Modal>