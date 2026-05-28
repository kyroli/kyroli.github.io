<script lang="ts">
import { Plus } from '@lucide/svelte';
import { flip } from 'svelte/animate';
import { cubicOut } from 'svelte/easing';
import { dndState, draggable } from '$lib/actions/dnd.svelte';
import { tooltip } from '$lib/actions/tooltip';
import { ANIMATION_SPEED, UI_CONSTANTS } from '$lib/constants';
import { appState } from '$lib/core/app.svelte';
import { MESSAGES } from '$lib/i18n';
import type { VisualGroup } from '$lib/types'; // 如果 types 里没有 VisualGroup，我们可以局部定义，这里用 VisualGroup
import GroupHeader from './GroupHeader.svelte';
import SiteCard from './SiteCard.svelte';

let { group, onDeleteGroup } = $props<{
  group: VisualGroup;
  onDeleteGroup: (name: string, id: string) => void;
}>();
</script>

<div class="group-item flex flex-col gap-4 relative">
  <GroupHeader {group} onDelete={onDeleteGroup} />

  <div class="{UI_CONSTANTS.GRID_LAYOUT} content-start min-h-[72px]">
    {#each group.sites as item (item.id)}
      <div 
        class="relative h-full z-10"
        animate:flip={{ 
          duration: dndState.type === 'group' ? 0 : ANIMATION_SPEED.FLIP, 
          easing: cubicOut 
        }}
        data-dnd-site-id={item.id}
      >
        {#if item.isPlaceholder}
          <div class="{UI_CONSTANTS.CARD_HEIGHT} w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 box-border"></div>
        {:else}
          <div 
            use:draggable={{ type: 'site', id: item.id, groupId: group.id }} 
            class="h-full rounded-xl"
          >
            <SiteCard site={item} groupId={group.id} />
          </div>
        {/if}
      </div>
    {/each}

    {#if appState.isEditMode}
      <button 
        onclick={() => appState.openSiteModal(group.id)} 
        class={`w-full flex flex-col gap-2 items-center justify-center rounded-xl border-2 border-dashed border-border/50 text-text-dim/40 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer group active-press`}
        use:tooltip={MESSAGES.UI.NEW_SITE}
      >
        <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    {/if}
  </div>
</div>
