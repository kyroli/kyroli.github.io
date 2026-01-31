<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { dndzone, SOURCES, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
  
  const flipDurationMs = 200;

  function handleGroupDnd(e: CustomEvent<DndEvent<any>>) {
    const { items: newItems, info } = e.detail;
    dataState.groups = newItems;
    
    if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED) {
      dataState.markDirty();
    }
  }

  function ensureButtonAtEnd(items: any[], groupId: string) {
    const sites = items.filter((i: any) => !i.isAddBtn);
    const btn = items.find((i: any) => i.isAddBtn) || { 
      id: `__btn_${groupId}`, 
      isAddBtn: true, 
      name: '', url: '', icon: '' 
    };
    
    return [...sites, btn];
  }

  function handleSiteDnd(groupId: string, e: CustomEvent<DndEvent<any>>) {
    const { items: newItems, info } = e.detail;
    
    const sortedItems = appState.isEditMode 
        ? ensureButtonAtEnd(newItems, groupId)
        : newItems.filter((i: any) => !i.isAddBtn);

    const groupIndex = dataState.groups.findIndex(g => g.id === groupId);
    if (groupIndex > -1) {
        dataState.groups[groupIndex].sites = sortedItems;
    }

    if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED) {
        dataState.markDirty();
    }
  }

  function handleDeleteGroup(groupName: string, groupId: string) {
    appState.openConfirm({
      msg: `${MESSAGES.CONFIRM.DELETE_GROUP_PREFIX}${groupName}${MESSAGES.CONFIRM.DELETE_GROUP_SUFFIX}`,
      onConfirm: () => manager.deleteGroup(groupId),
      isDestructive: true
    });
  }

  function stopPropagation(e: Event) {
    e.stopPropagation();
  }
</script>

<div 
  class="w-full flex flex-col gap-6 pt-6 pb-20"
  use:dndzone={{
    items: dataState.groups, 
    flipDurationMs,
    dragDisabled: !appState.isEditMode, 
    type: 'group',
    dropTargetStyle: { outline: 'none', border: 'none' }
  }}
  onconsider={handleGroupDnd}
  onfinalize={handleGroupDnd}
>
  
  {#each dataState.groups as group (group.id)}
    {@const displaySites = appState.isEditMode 
        ? ensureButtonAtEnd(group.sites, group.id)
        : group.sites.filter((s: any) => !s.isAddBtn)
    }

    <div 
        class="group-item flex flex-col bg-surface/30 rounded-2xl border border-transparent transition-colors duration-200 pb-2
               {appState.isEditMode ? 'border-border/40 hover:border-primary/20' : ''}"
        role="group"
    >
      <div 
        class="flex items-center px-4 py-3 border-b border-border/40 min-h-[50px]"
        onmousedown={stopPropagation}
        ontouchstart={stopPropagation}
        role="presentation"
      >
        {#if appState.isEditMode}
           <div 
             class="cursor-grab active:cursor-grabbing p-2 mr-3 rounded-lg hover:bg-surface text-text-dim hover:text-primary transition-colors touch-none"
             onmousedown={(e) => { 
             }}
             role="button"
             tabindex="0"
           >
             <GripHorizontal class="w-4 h-4" />
          </div>
        {/if}
        
        <div class="flex-1 flex items-center min-w-0 justify-between">
            <h2 class="font-bold text-xs tracking-[0.15em] text-text-dim/80 select-none truncate uppercase">{group.name}</h2>
            {#if appState.isEditMode}
               <div class="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
                 <button onclick={() => appState.openGroupModal(group.id)} class="text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors" title={MESSAGES.UI.TIP_RENAME_GROUP}>
                   <Pencil class="w-3.5 h-3.5" />
                </button>
                 <button onclick={() => handleDeleteGroup(group.name, group.id)} class="text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors" title={MESSAGES.UI.TIP_DELETE_GROUP}>
                   <Trash2 class="w-3.5 h-3.5" />
                 </button>
               </div>
            {/if}
        </div>
      </div>

      <div 
        class="{UI_CONSTANTS.GRID_LAYOUT} p-4 min-h-[20px]"
        onmousedown={stopPropagation}
        ontouchstart={stopPropagation}
        role="list"
        use:dndzone={{
            items: displaySites,
            flipDurationMs,
            dragDisabled: !appState.isEditMode,
            type: 'site',
            dropTargetStyle: {} 
        }}
        onconsider={(e) => handleSiteDnd(group.id, e)}
        onfinalize={(e) => handleSiteDnd(group.id, e)}
      >
          {#each displaySites as item (item.id)}
            {#if (item as any).isAddBtn}
                <div 
                    role="button" 
                    tabindex="0"
                    class="h-full min-h-[72px]" 
                    data-id={item.id}
                    onmousedown={stopPropagation}
                    ontouchstart={stopPropagation}
                >
                    <button 
                        onclick={() => appState.openSiteModal(group.id)} 
                        class="w-full h-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/40 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer active:scale-[0.98] group"
                        title={MESSAGES.UI.NEW_SITE}
                    >
                        <div class="w-8 h-8 rounded-full bg-surface border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-primary/30 group-hover:text-primary">
                            <Plus class="w-4 h-4" />
                        </div>
                        <span class="text-[10px] font-bold tracking-wider uppercase">{MESSAGES.UI.NEW_SITE}</span>
                    </button>
                </div>
            {:else}
                <div role="listitem" data-id={item.id}>
                    <SiteCard site={item} groupId={group.id} />
                </div>
            {/if}
          {/each}
      </div>

    </div>
  {/each}

  {#if appState.isEditMode}
   <button onclick={() => appState.openGroupModal()} class="w-full py-6 border-2 border-dashed border-border/40 rounded-2xl flex items-center justify-center gap-3 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer group active:scale-[0.99] animate-fade my-4">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>