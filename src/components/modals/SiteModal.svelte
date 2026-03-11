<script lang="ts">
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { Contrast } from 'lucide-svelte';
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
  const modalTitle = siteId ? MESSAGES.MODAL.SITE_TITLE_EDIT : MESSAGES.MODAL.SITE_TITLE_NEW;

  let name = $state(site?.name ?? '');
  let url = $state(site?.url ?? '');
  let icon = $state(site?.icon ?? '');
  let invert = $state(site?.invert ?? false);
  let error = $state('');

  function handleSave() {
    error = '';
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    const trimmedIcon = icon.trim();

    if (!trimmedName || !trimmedUrl) {
      error = MESSAGES.TOAST.SITE_URL_ERROR || 'Name and URL are required';
      return;
    }

    if (siteId && site) {
      if (
        trimmedName === site.name && 
        trimmedUrl === site.url && 
        trimmedIcon === (site.icon || '') && 
        invert === !!site.invert
      ) {
        onClose();
        return;
      }
    }

    try {
      manager.saveSite(groupId, {
        id: siteId,
        name: trimmedName,
        url: trimmedUrl,
        icon: trimmedIcon,
        invert
      });
      appState.showToast(MESSAGES.TOAST.SITE_SAVED, 'success');
      onClose();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : MESSAGES.TOAST.SITE_URL_ERROR;
    }
  }

  const errorBannerClass = "bg-danger/10 border border-danger/20 rounded-lg p-3 text-danger text-xs font-bold animate-fade";
</script>

{#snippet headerExtra()}
  <Button 
    variant={invert ? 'primary' : 'ghost'} 
    onclick={() => invert = !invert} 
    type="button"
    class="!p-1.5 !rounded-lg border-none {invert ? '' : 'text-text-dim'}"
    title={MESSAGES.UI.TIP_INVERT_ICON}
  >
    <Contrast class="w-5 h-5" />
  </Button>
{/snippet}

<Modal {onClose} title={modalTitle} {headerExtra}>
  {#if error}
    <div class={errorBannerClass}>⚠️ {error}</div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-3">
    <Input 
      bind:value={name} 
      placeholder={MESSAGES.MODAL.SITE_NAME_PLACEHOLDER} 
      oninput={() => error = ''}
      required
    />
    <Input 
      bind:value={url} 
      placeholder={MESSAGES.MODAL.SITE_URL_PLACEHOLDER} 
      oninput={() => error = ''}
      required
    />
    <Input 
      bind:value={icon} 
      placeholder={MESSAGES.MODAL.SITE_ICON_PLACEHOLDER} 
      oninput={() => error = ''}
    />
    
    <div class="flex gap-2 pt-4">
      <Button variant="ghost" type="button" onclick={onClose} class="flex-1 font-bold text-text-dim">
        {MESSAGES.UI.CANCEL}
      </Button>
      <Button type="submit" class="flex-1">
        {MESSAGES.UI.COMPLETE}
      </Button>
    </div>
  </form>
</Modal>