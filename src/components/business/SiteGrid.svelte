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

  let canDragGroup = $state(false);

  function handleGroupDnd(e: CustomEvent<DndEvent<any>>) {
    const { items: newItems, info } = e.detail;
    dataState.groups = newItems;
    
    if (info.source === SOURCES.POINTER && (info.trigger === TRIGGERS.DROPPED || info.trigger === TRIGGERS.DRAG_STOPPED)) {
      dataState.markDirty();
      canDragGroup = false; 
    }
  }

  function handleSiteDnd(groupId: string, e: CustomEvent<DndEvent<any>>) {
    const { items: newSites, info } = e.detail;
    const groupIndex = dataState.groups.findIndex(g => g.id === groupId);
    
    if (groupIndex > -1) {
        dataState.groups[groupIndex].sites = newSites;
        
        if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED) {
            dataState.markDirty();
        }
    }
  }

  function handleDeleteGroup(groupName: string, groupId: string) {
    appState.openConfirm({
      msg: `${MESSAGES.CONFIRM.DELETE_GROUP_PREFIX}${groupName}${MESSAGES.CONFIRM.DELETE_GROUP_SUFFIX}`,
      onConfirm: () => manager.deleteGroup(groupId),
      isDestructive: true
    });
  }
</script>

<svelte:window onmouseup={() => canDragGroup = false} />

<div 
  class="w-full flex flex-col gap-6 pt-6 pb-20"
  use:dndzone={{
    items: dataState.groups, 
    flipDurationMs,
    dragDisabled: !appState.isEditMode || !canDragGroup, 
    type: 'group',
    dropTargetStyle: { outline: 'none', border: 'none' }
  }}
  onconsider={handleGroupDnd}
  onfinalize={handleGroupDnd}
>
  
  {#each dataState.groups as group (group.id)}
    <div 
        class="group-item flex flex-col bg-surface/30 rounded-2xl border border-transparent transition-colors duration-200 pb-4
               {appState.isEditMode ? 'border-border/40 hover:border-primary/20' : ''}"
    >
      <div class="flex items-center px-4 py-3 border-b border-border/40 min-h-[50px]">
        {#if appState.isEditMode}
           <div 
             class="cursor-grab active:cursor-grabbing p-2 mr-3 rounded-lg hover:bg-surface text-text-dim hover:text-primary transition-colors touch-none"
             onmousedown={() => canDragGroup = true}
             ontouchstart={() => canDragGroup = true}
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

      <div class="{UI_CONSTANTS.GRID_LAYOUT} p-4 min-h-[20px]">
          
          <div 
            style="display: contents"
            use:dndzone={{
                items: group.sites,
                flipDurationMs,
                dragDisabled: !appState.isEditMode,
                type: 'site',
                dropTargetStyle: {}
            }}
            onconsider={(e) => handleSiteDnd(group.id, e)}
            onfinalize={(e) => handleSiteDnd(group.id, e)}
          >
              {#each group.sites as item (item.id)}
                <div class="h-full"> 
                    <SiteCard site={item} groupId={group.id} />
                </div>
              {/each}
          </div>

          {#if appState.isEditMode}
            <button 
                onclick={() => appState.openSiteModal(group.id)} 
                class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/40 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer active:scale-[0.98] group h-full min-h-[100px]"
                title={MESSAGES.UI.NEW_SITE}
            >
                <div class="w-10 h-10 rounded-full bg-surface border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-primary/30 group-hover:text-primary">
                    <Plus class="w-5 h-5" />
                </div>
                <span class="text-[11px] font-bold tracking-wider uppercase">{MESSAGES.UI.NEW_SITE}</span>
            </button>
          {/if}

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