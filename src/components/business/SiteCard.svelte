<script lang="ts">
  import { MESSAGES } from '$lib/i18n';
  import { getIcon, DEFAULT_ICON } from '$lib/utils';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import type { Site } from '$lib/types';
  import { Trash2 } from 'lucide-svelte';
  import CardBase from './CardBase.svelte';
  import { tooltip } from '$lib/actions/tooltip';

  let { site, groupId } = $props<{ site: Site, groupId: string }>();

  const displayHostname = $derived(new URL(site.url).hostname.replace(/^www\./, ''));
  const safeHref = $derived(!appState.isEditMode ? site.url : undefined);

  const cardClass = $derived(`group relative transition-all duration-200 border active-press ${
    appState.isEditMode 
      ? 'cursor-move border-border/60 bg-surface border-dashed hover:border-primary hover:border-solid hover:shadow-sm hover:bg-surface/50' 
      : 'border-transparent hover:border-border hover:shadow-solid'
  }`);

  let hasImageError = $state(false);

  const imgClass = $derived(`w-full h-full object-contain pointer-events-none transition-all duration-200 ${
    appState.isDark && site.invert && !hasImageError ? 'invert' : ''
  }`);

  function handleImageError(e: Event) {
    const img = e.currentTarget as HTMLImageElement;
    if (img.src !== DEFAULT_ICON) {
      img.src = DEFAULT_ICON;
      hasImageError = true;
    }
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    appState.openConfirm({
      msg: MESSAGES.CONFIRM.DELETE_SITE,
      onConfirm: () => {
         manager.deleteSite(groupId, site.id);
         appState.showToast(MESSAGES.TOAST.SITE_DELETED, 'success');
      },
      isDestructive: true
    });
  }

  function handleClick(e: MouseEvent) {
    if(appState.isEditMode) { 
      e.preventDefault();
      appState.openSiteModal(groupId, site.id);
    } 
  }
</script>

<div class="site-card relative h-full" data-id={site.id}>
  <CardBase href={safeHref} onclick={handleClick} class={cardClass}>
    <div class="shrink-0 w-10 h-10 rounded-xl bg-icon-bg flex items-center justify-center overflow-hidden border border-border/50 transition-transform duration-200 group-hover:scale-105 p-2">
      <img 
        src={getIcon(site.url, site.icon)} 
        onerror={handleImageError}
        class={imgClass}
        loading="lazy" 
        decoding="async" 
        alt={site.name} 
      />
    </div>

    <div class="flex flex-col overflow-hidden pointer-events-none min-w-0 flex-1 gap-1">
      <span class="text-[15px] font-bold text-text truncate leading-normal tracking-tight">{site.name}</span>
      <span class="text-[10px] font-bold font-mono text-text-dim/60 truncate leading-normal tracking-widest uppercase opacity-80">{displayHostname}</span>
    </div>

    {#if appState.isEditMode}
      <button 
        class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all z-20 bg-surface border border-border text-text-dim shadow-sm hover:text-danger hover:border-danger hover:scale-110 active-press-icon" 
        onclick={handleDelete} 
        use:tooltip={MESSAGES.UI.TIP_DELETE_SITE}
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    {/if}
  </CardBase>
</div>