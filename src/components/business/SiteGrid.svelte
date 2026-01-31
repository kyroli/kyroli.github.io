<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  
  const flipDurationMs = 200;

  function handleGroupDnd(e: CustomEvent<DndEvent<any>>) {
    const { items: newItems } = e.detail;
    dataState.groups = newItems;
    
    if (e.detail.trigger === 'dropped') {
      dataState.markDirty();
    }
  }

  function handleSiteDnd(groupId: string, e: CustomEvent<DndEvent<any>>) {
    const { items: newSites } = e.detail;
    const groupIndex = dataState.groups.findIndex(g => g.id === groupId);
    
    if (groupIndex > -1) {
      const currentGroup = dataState.groups[groupIndex];
      dataState.groups[groupIndex] = { 
        ...currentGroup, 
        sites: newSites 
      };

      if (e.detail.trigger === 'dropped') {
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
    <div 
        class="group-item flex flex-col bg-surface/30 rounded-2xl border border-transparent transition-colors duration-200
               {appState.isEditMode ? 'border-border/40 hover:border-primary/20' : ''}"
    >
      <div class="flex items-center px-4 py-3 border-b border-border/40 min-h-[50px]">
        
        {#if appState.isEditMode}
           <div 
              class="cursor-grab active:cursor-grabbing p-2 mr-3 rounded-lg hover:bg-surface text-text-dim hover:text-primary transition-colors touch-none"
              data-dnd-handle
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
            <div role="listitem" class="h-full">
                <SiteCard site={item} groupId={group.id} />
            </div>
          {/each}
      </div>

      {#if appState.isEditMode}
        <div class="px-4 pb-4 pt-0">
            <button 
                onclick={() => appState.openSiteModal(group.id)} 
                class="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/60 text-text-dim/60 hover:text-primary hover:border-primary/40 hover:bg-surface transition-all cursor-pointer active:scale-[0.99]"
                title={MESSAGES.UI.NEW_SITE}
            >
                <Plus class="w-4 h-4" />
                <span class="text-xs font-bold tracking-wide">{MESSAGES.UI.NEW_SITE}</span>
            </button>
        </div>
      {/if}

    </div>
  {/each}

  {#if appState.isEditMode}
   <button onclick={() => appState.openGroupModal()} class="w-full py-6 border border-border/40 rounded-2xl flex items-center justify-center gap-3 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer group active:scale-[0.99] animate-fade">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>