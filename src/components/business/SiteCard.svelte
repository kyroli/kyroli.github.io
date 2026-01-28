<script lang="ts">
  // 1. Imports
  import { app } from '$lib/store.svelte';
  import { getIcon } from '$lib/utils';
  import globeIcon from '@/assets/globe.svg';
  import type { Site } from '$lib/types';
  import Card from '../ui/Card.svelte';

  // 2. Props
  let { site, onEdit } = $props<{ 
    site: Site,
    onEdit: () => void 
  }>();

  // 3. Derived
  const displayHostname = $derived.by(() => {
    try {
      const u = new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`);
      return u.hostname.replace('www.', '').toUpperCase();
    } catch {
      return '';
    }
  });

  const safeHref = $derived(!app.isEdit && /^https?:\/\//i.test(site.url) ? site.url : undefined);
  
  const cardClass = $derived(`flex flex-row items-center gap-4 p-4 h-[72px] ${app.isEdit ? 'cursor-move border-dashed border-primary/40' : ''} hover:scale-[1.02] active:scale-[0.98]`);

  // 4. Handlers
  function handleImgError(e: Event, siteUrl: string) {
    const img = e.currentTarget as HTMLImageElement;
    if (img.dataset.triedGoogle) {
      img.src = globeIcon;
      return;
    }
    img.dataset.triedGoogle = "true";
    try {
      const hostname = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`).hostname;
      img.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      img.src = globeIcon;
    }
  }

  function handleClick(e: MouseEvent) {
      if(app.isEdit) { 
        e.preventDefault();
        onEdit(); 
      } 
  }

  // 5. Visual Constants
  const wrapperClass = "site-card relative h-full";
  const iconContainerClass = "shrink-0 w-10 h-10 rounded-xl bg-icon-bg flex items-center justify-center p-2 border border-border/40 shadow-sm";
  const imgClass = "w-full h-full object-contain pointer-events-none";
  const textContainerClass = "flex flex-col overflow-hidden pointer-events-none min-w-0 flex-1 gap-0.5";
  const nameClass = "text-[15px] font-bold text-text truncate tracking-tight leading-snug";
  const hostnameClass = "text-[11px] text-text-dim/60 truncate font-mono opacity-80";
</script>

<div class={wrapperClass} data-id={site.id}>
  <Card href={safeHref} onclick={handleClick} class={cardClass}>
    <div class={iconContainerClass}>
       <img 
         src={getIcon(site.url, site.icon)} 
         class={imgClass} 
         loading="lazy" 
         decoding="async" 
         alt="" 
         onerror={(e) => handleImgError(e, site.url)}
       />
    </div>
    
    <div class={textContainerClass}>
      <span class={nameClass}>{site.name}</span>
      <span class={hostnameClass}>{displayHostname}</span>
    </div>
  </Card>
</div>