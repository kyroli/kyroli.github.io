<script lang="ts">
  import { onMount } from 'svelte';
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { flip } from 'svelte/animate';
  
  import { pdndDraggable, pdndDropTarget, initDnDMonitor } from '$lib/actions/pdnd.svelte';

  const FLIP_DURATION = 300;

  onMount(() => {
    return initDnDMonitor({
      onMoveToGroupEnd: (itemId, targetGroupId) => {
         manager.moveSiteToGroup(itemId, targetGroupId);
      },
      
      onMoveItem: (itemId, targetGroupId, targetId, edge) => {
         const group = dataState.groups.find(g => g.id === targetGroupId);
         if (!group) return;

         const targetIndex = group.sites.findIndex(s => s.id === targetId);
         if (targetIndex === -1) return;

         const finalIndex = edge === 'right' ? targetIndex + 1 : targetIndex;
         manager.moveSite(itemId, targetGroupId, finalIndex);
      },

      onMoveGroup: (sourceGroupId, targetGroupId, edge) => {
         const groups = [...dataState.groups];
         const fromIndex = groups.findIndex(g => g.id === sourceGroupId);
         const toIndex = groups.findIndex(g => g.id === targetGroupId);

         if (fromIndex === -1 || toIndex === -1) return;

         const [item] = groups.splice(fromIndex, 1);
         let finalIndex = toIndex;
         if (edge === 'bottom' && fromIndex > toIndex) finalIndex++;
         if (edge === 'bottom' && fromIndex < toIndex) { /* no-op, splice handles shift */ }
         if (edge === 'top' && fromIndex < toIndex) finalIndex--;
         
         const targetReIndex = edge === 'bottom' ? toIndex + 1 : toIndex;
         const newToIndex = groups.findIndex(g => g.id === targetGroupId);
         const insertIndex = edge === 'bottom' ? newToIndex + 1 : newToIndex;
         
         groups.splice(insertIndex, 0, item);
         manager.updateGroupOrder(groups);
      }
    });
  });

  function handleDeleteGroup(groupName: string, groupId: string) {
    appState.openConfirm({
      msg: `${MESSAGES.CONFIRM.DELETE_GROUP_PREFIX}${groupName}${MESSAGES.CONFIRM.DELETE_GROUP_SUFFIX}`,
      onConfirm: () => manager.deleteGroup(groupId),
      isDestructive: true
    });
  }
</script>

<div class="w-full flex flex-col gap-5 pt-6 pb-0">
  {#each dataState.groups as group (group.id)}
    <div 
        class="group-item flex flex-col gap-4 transition-colors duration-200 rounded-xl border
               {appState.isEditMode ? 'border-border/40' : 'border-transparent'}"
        animate:flip={{ duration: FLIP_DURATION }}
        
        use:pdndDropTarget={{ type: 'group', id: group.id }}
    >
      <div class="flex items-center pb-3 px-1 h-10 mt-3 border-b border-border/40 cursor-default">
        <div 
           class="p-1.5 mr-3 rounded-lg border border-border/60 text-text-dim transition-all touch-none bg-surface/50 shrink-0
                  {appState.isEditMode ? 'opacity-100 cursor-grab hover:border-primary/50 hover:text-primary active:cursor-grabbing' : 'opacity-0 pointer-events-none border-transparent'}"
           use:pdndDraggable={{ type: 'group', id: group.id, enabled: appState.isEditMode }}
        >
           <GripHorizontal class="w-4 h-4" />
        </div>
        
        <div class="flex-1 flex items-center min-w-0 h-full">
            <h2 class="font-bold text-[11px] tracking-[0.15em] text-text-dim/60 select-none truncate flex-1 uppercase">{group.name}</h2>
            
            <div class={`flex gap-1 transition-opacity animate-fade shrink-0 ml-2 ${appState.isEditMode ? 'opacity-60 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <button onclick={() => appState.openGroupModal(group.id)} class="text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_RENAME_GROUP}>
                   <Pencil class="w-4 h-4" />
                </button>
                 <button onclick={() => handleDeleteGroup(group.name, group.id)} class="text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_DELETE_GROUP}>
                   <Trash2 class="w-4 h-4" />
                 </button>
            </div>
        </div>
      </div>

      <div class="{UI_CONSTANTS.GRID_LAYOUT} content-start min-h-[72px] p-2 rounded-lg">
          {#each group.sites as item (item.id)}
            <div 
                class="relative h-full transition-opacity duration-200 select-none"
                animate:flip={{ duration: FLIP_DURATION }}
                
                use:pdndDraggable={{ 
                    type: 'site', 
                    id: item.id, 
                    groupId: group.id,
                    enabled: appState.isEditMode
                }}
                
                use:pdndDropTarget={{ 
                    type: 'site', 
                    id: item.id, 
                    groupId: group.id
                }}
            >
                <div class="h-full">
                   <SiteCard site={item} groupId={group.id} />
                </div>
                
                {#if appState.isEditMode}
                   <div class="absolute inset-0 z-0 rounded-xl pointer-events-none border border-transparent hover:border-primary/30"></div>
                {/if}
            </div>
          {/each}

          {#if appState.isEditMode}
            <button 
                onclick={() => appState.openSiteModal(group.id)} 
                class={`w-full flex flex-col gap-2 items-center justify-center rounded-xl border border-border/40 text-text-dim/40 hover:text-primary hover:border-primary/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer bg-surface/30 group active:scale-[0.98]`}
                title={MESSAGES.UI.NEW_SITE}
                
                use:pdndDropTarget={{ 
                    type: 'site', 
                    groupId: group.id, 
                    isAddButton: true 
                }}
            >
                <div class="w-8 h-8 rounded-full bg-surface/50 border border-border/50 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
                    <Plus class="w-4 h-4" />
                </div>
            </button>
          {/if}
      </div>
    </div>
  {/each}

  {#if appState.isEditMode}
   <button onclick={() => appState.openGroupModal()} class="w-full py-8 border border-border/40 rounded-3xl flex items-center justify-center gap-3 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer group mt-4 active:scale-[0.99] animate-fade">
      <Plus class="w-6 h-6 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>