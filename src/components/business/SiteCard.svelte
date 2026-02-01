<script lang="ts">
  import { MESSAGES } from '$lib/i18n';
  import { getIcon } from '$lib/utils';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import type { Site } from '$lib/types';
  import { Trash2 } from 'lucide-svelte';
  import CardBase from './CardBase.svelte';

  let { site, groupId } = $props<{ site: Site, groupId: string }>();

  const displayHostname = $derived.by(() => {
    try {
        const u = new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`);
        return u.hostname.replace(/^www\./, '');
    } catch {
        return site.url;
    }
  });

  const safeHref = $derived(!appState.isEditMode && /^https?:\/\//i.test(site.url) ? site.url : undefined);

  const cardClass = $derived(`group relative transition-all duration-300 border ${
    appState.isEditMode 
      ? 'cursor-move border-border/60 bg-surface border-dashed select-none hover:border-primary hover:border-solid hover:shadow-sm hover:bg-surface/50' 
      : 'border-transparent hover:border-border hover:shadow-solid active:scale-[0.98]'
  }`);

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    appState.openConfirm({
      msg: MESSAGES.CONFIRM.DELETE_SITE,
      onConfirm: () => manager.deleteSite(groupId, site.id),
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
    <div class="shrink-0 w-10 h-10 rounded-xl bg-icon-bg flex items-center justify-center overflow-hidden border border-border transition-transform duration-200 group-hover:scale-105 p-2">
      <img 
        src={getIcon(site.url, site.icon)} 
        class="w-full h-full object-contain pointer-events-none" 
        loading="lazy" 
        decoding="async" 
        alt={site.name} 
      />
    </div>
    
    <div class="flex flex-col overflow-hidden pointer-events-none min-w-0 flex-1 gap-0.5">
      <span class="text-[15px] font-medium text-text truncate tracking-tight leading-snug">{site.name}</span>
      <span class="text-[11px] font-medium text-text-dim/60 truncate tracking-[0.1em] uppercase">{displayHostname}</span>
    </div>

    {#if appState.isEditMode}
      <button 
        class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all z-20 
               bg-surface border border-border text-text-dim shadow-sm
               hover:text-danger hover:border-danger hover:scale-110 active:scale-95" 
        onclick={handleDelete} 
        title={MESSAGES.UI.DELETE}
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    {/if}
  </CardBase>
</div>