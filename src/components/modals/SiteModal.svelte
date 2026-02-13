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

  const group = $derived(dataState.groups.find(g => g.id === groupId));
  const site = $derived(siteId ? group?.sites.find(s => s.id === siteId) : null);

  let name = $state(site?.name ?? '');
  let url = $state(site?.url ?? '');
  let icon = $state(site?.icon ?? '');
  let invert = $state(site?.invert ?? false);
  let error = $state('');

  const modalTitle = $derived(siteId ? MESSAGES.MODAL.SITE_TITLE_EDIT : MESSAGES.MODAL.SITE_TITLE_NEW);

  $effect(() => {
    if (site) {
        name = site.name;
        url = site.url;
        icon = site.icon;
        invert = site.invert ?? false;
    } else {
        name = '';
        url = '';
        icon = '';
        invert = false;
    }
  });

  function handleSave() {
    error = '';
    try {
      manager.saveSite(groupId, {
        id: siteId,
        name,
        url,
        icon,
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

<Modal {onClose} title={modalTitle}>
  <div class="absolute top-6 right-6">
    <Button 
      variant={invert ? 'primary' : 'ghost'} 
      onclick={() => invert = !invert} 
      class="!p-2 !rounded-lg {invert ? '' : 'text-text-dim'}"
      title={MESSAGES.UI.TIP_INVERT_ICON}
    >
      <Contrast class="w-5 h-5" />
    </Button>
  </div>

  {#if error}
    <div class={errorBannerClass}>⚠️ {error}</div>
  {/if}

  <div class="space-y-3">
    <Input 
      bind:value={name} 
      placeholder={MESSAGES.MODAL.SITE_NAME_PLACEHOLDER} 
      oninput={() => error = ''}
      onkeydown={(e) => e.key === 'Enter' && handleSave()}
    />
    <Input 
      bind:value={url} 
      placeholder={MESSAGES.MODAL.SITE_URL_PLACEHOLDER} 
      oninput={() => error = ''}
      onkeydown={(e) => e.key === 'Enter' && handleSave()}
    />
    <Input 
      bind:value={icon} 
      placeholder={MESSAGES.MODAL.SITE_ICON_PLACEHOLDER} 
      oninput={() => error = ''}
      onkeydown={(e) => e.key === 'Enter' && handleSave()}
    />
    
    <div class="flex gap-2 pt-4">
      <Button variant="ghost" onclick={onClose} class="flex-1 font-bold text-text-dim">{MESSAGES.UI.CANCEL}</Button>
      <Button onclick={handleSave} class="flex-1">{MESSAGES.UI.COMPLETE}</Button>
    </div>
  </div>
</Modal>