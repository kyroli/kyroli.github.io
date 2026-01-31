<script lang="ts">
  import { MESSAGES } from '$lib/i18n';
  import { getIcon } from '$lib/utils';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import type { Site } from '$lib/types';
  import { X } from 'lucide-svelte';
  import CardBase from './CardBase.svelte';

  let { site, groupId } = $props<{ site: Site, groupId: string }>();
  
  let loadError = $state(false);

  const displayHostname = $derived.by(() => {
    try {
      const u = new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`);
      return u.hostname.replace('www.', '');
    } catch { return ''; }
  });

  const firstChar = $derived(site.name ? site.name.charAt(0).toUpperCase() : '?');
  const safeHref = $derived(!appState.isEditMode && /^https?:\/\//i.test(site.url) ? site.url : undefined);

  const cardClass = $derived(`group relative transition-all duration-300 border ${
    appState.isEditMode 
      ? 'cursor-move border-primary/20 shadow-lg scale-[1.02] z-10' 
      : 'border-transparent hover:border-border hover:shadow-solid active:scale-[0.99]'
  }`);

  function getSiteColor(name: string) {
    const bgHue = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    return `background-color: hsl(${bgHue}, 65%, var(--fallback-bg-l)); color: hsl(${bgHue}, 70%, var(--fallback-text-l));`;
  }

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
    <div class="shrink-0 w-10 h-10 rounded-[10px] bg-icon-bg flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/5 transition-transform duration-200 group-hover:scale-105 font-bold text-lg p-2" 
        style={loadError ? getSiteColor(site.name) : ''}>
      {#if loadError}
        <span>{firstChar}</span>
      {:else}
        <img 
          src={getIcon(site.url, site.icon)} 
          class="w-full h-full object-contain pointer-events-none" 
          loading="lazy" 
          decoding="async" 
          alt="" 
          onerror={() => loadError = true}
        />
      {/if}
    </div>
    
    <div class="flex flex-col overflow-hidden pointer-events-none min-w-0 flex-1 gap-0.5">
      <span class="text-[15px] font-medium text-text truncate tracking-tight leading-snug">{site.name}</span>
      <span class="text-[11px] text-text-dim/50 truncate font-mono tracking-wider uppercase">{displayHostname}</span>
    </div>

    {#if appState.isEditMode}
      <button class="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform z-20" 
        onclick={handleDelete} title={MESSAGES.UI.DELETE}>
        <X class="w-3 h-3" stroke-width={3} />
      </button>
    {/if}
  </CardBase>
</div>