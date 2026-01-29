<script lang="ts">
  // 1. Imports
  import { app } from '$lib/store.svelte';
  import { getIcon } from '$lib/utils';
  import type { Site } from '$lib/types';
  import { ICONS } from '$lib/icons';
  import CardBase from './CardBase.svelte';

  // 2. Props
  let { site, onEdit } = $props<{ 
    site: Site,
    onEdit: () => void 
  }>();

  // 3. State
  let loadError = $state(false);

  // 4. Derived
  const displayHostname = $derived.by(() => {
    try {
      const u = new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`);
      return u.hostname.replace('www.', '');
    } catch {
      return '';
    }
  });

  const firstChar = $derived(site.name ? site.name.charAt(0).toUpperCase() : '?');
  const safeHref = $derived(!app.isEdit && /^https?:\/\//i.test(site.url) ? site.url : undefined);

  const cardClass = $derived(`group relative transition-all duration-300 border ${
    app.isEdit 
      ? 'cursor-move border-primary/20 shadow-lg scale-[1.02] z-10' 
      : 'border-transparent hover:border-border hover:shadow-solid active:scale-[0.99]'
  }`);

  const bgHue = $derived(
    site.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360
  );
  
  const fallbackStyle = $derived(`
    background-color: hsl(${bgHue}, 65%, var(--fallback-bg-l)); 
    color: hsl(${bgHue}, 70%, var(--fallback-text-l));
  `);

  // 5. Handlers
  function handleImgError() {
    loadError = true;
  }

  function handleClick(e: MouseEvent) {
      if(app.isEdit) { 
        e.preventDefault();
        onEdit(); 
      } 
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const group = app.data.groups.find(g => g.sites.some(s => s.id === site.id));
    if (group) {
        app.deleteSite(group.id, site.id);
    }
  }

  // 6. Visual Constants
  const wrapperClass = "site-card relative h-full";
  
  const iconContainerClass = "shrink-0 w-10 h-10 rounded-[10px] bg-icon-bg flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/5 transition-transform duration-200 group-hover:scale-105 font-bold text-lg";
  
  const imgClass = "w-full h-full object-contain pointer-events-none";
  const textContainerClass = "flex flex-col overflow-hidden pointer-events-none min-w-0 flex-1 gap-0.5";
  
  const nameClass = "text-[15px] font-medium text-text truncate tracking-tight leading-snug";
  const hostnameClass = "text-[11px] text-text-dim/50 truncate font-mono tracking-tight";
  
  const removeBtnClass = "absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform z-20";
</script>

<div class={wrapperClass} data-id={site.id}>
  <CardBase href={safeHref} onclick={handleClick} class={cardClass}>
    <div class={iconContainerClass} style={loadError ? fallbackStyle : ''}>
       {#if loadError}
         <span>{firstChar}</span>
       {:else}
         <img 
           src={getIcon(site.url, site.icon)} 
           class={imgClass} 
           loading="lazy" 
           decoding="async" 
           alt="" 
           onerror={handleImgError}
         />
       {/if}
    </div>
    
    <div class={textContainerClass}>
      <span class={nameClass}>{site.name}</span>
      <span class={hostnameClass}>{displayHostname}</span>
    </div>

    {#if app.isEdit}
      <button class={removeBtnClass} onclick={handleDelete} title="删除站点">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox={ICONS.close.viewBox} stroke-width="3">{@html ICONS.close.path}</svg>
      </button>
    {/if}
  </CardBase>
</div>