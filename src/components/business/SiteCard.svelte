<script lang="ts">
  import { MESSAGES } from '$lib/i18n';
  import { getIcon } from '$lib/utils';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import type { Site } from '$lib/types';
  import { X } from 'lucide-svelte';
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
      ? 'cursor-move border-border/60 bg-surface border-dashed' 
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
      <button class="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform z-20 border border-white dark:border-zinc-900" 
        onclick={handleDelete} title={MESSAGES.UI.DELETE}>
        <X class="w-3 h-3" stroke-width={3} />
      </button>
  
    {/if}
  </CardBase>
</div>