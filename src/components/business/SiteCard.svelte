<script lang="ts">
import { tooltip } from '$lib/actions/tooltip.svelte';
import { appState } from '$lib/core/app.svelte';
import { MESSAGES } from '$lib/i18n';
import { manager } from '$lib/services/manager';
import type { Site } from '$lib/types';
import { getDomain, siteIcon } from '$lib/utils';
import Card from '../ui/Card.svelte';
import Icon from '../ui/Icon.svelte';

let { site, groupId }: { site: Site; groupId: string } = $props();

const safeHref = $derived(!appState.isEditMode ? site.url : undefined);

const cardClass = $derived([
  'group relative transition-all duration-200 border active-press',
  appState.isEditMode
    ? 'cursor-move border-border/60 bg-surface border-dashed hover:border-primary hover:border-solid hover:shadow-xs hover:bg-surface/50'
    : 'border-transparent hover:border-border hover:shadow-solid'
]);

const imgClass = 'w-full h-full object-contain pointer-events-none transition-all duration-200';

function handleDelete() {
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
  if (appState.isEditMode) {
    e.preventDefault();
    appState.openSiteModal(groupId, site.id);
  }
}
</script>

<div class="relative h-full">
  <Card href={safeHref} onclick={handleClick} class={cardClass}>
    <div class="shrink-0 w-10 h-10 rounded-xl bg-icon-bg flex items-center justify-center overflow-hidden border border-border/50 transition-transform duration-200 group-hover:scale-105 p-2">
      <img
        {@attach siteIcon(site.url)}
        class={imgClass}
        loading="lazy"
        decoding="async"
        alt={site.name}
      />
    </div>

    <div class="flex flex-col overflow-hidden pointer-events-none min-w-0 flex-1 gap-1">
      <span class="text-[15px] font-bold text-text truncate leading-normal tracking-tight">{site.name}</span>
      <span class="text-[10px] font-bold font-mono text-text-dim/70 truncate leading-normal tracking-widest uppercase">{getDomain(site.url)}</span>
    </div>
  </Card>

  {#if appState.isEditMode}
    <button
      type="button"
      class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all z-20 bg-surface border border-border text-text-dim shadow-sm hover:text-danger hover:border-danger hover:scale-110 active-press-icon" 
      onclick={handleDelete} 
      {@attach tooltip(MESSAGES.UI.TIP_DELETE_SITE)}
    >
      <Icon name="trash" class="w-3.5 h-3.5" />
    </button>
  {/if}
</div>
