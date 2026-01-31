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
  
  import { pdndDraggable, pdndDropTarget } from '$lib/actions/pdnd.svelte';
  import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
  import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

  const FLIP_DURATION = 300;

  onMount(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const sourceData = source.data;
        const targetData = target.data;

        if (sourceData.type !== 'site') return;

        const sourceId = sourceData.id as string;
        const targetGroupId = targetData.groupId as string;

        if (targetData.isAddButton) {
          if (sourceData.groupId !== targetGroupId) {
             manager.moveSiteToGroup(sourceId, targetGroupId);
          }
          return;
        }

        if (targetData.type === 'site') {
           const targetId = targetData.id as string;
           if (sourceId === targetId) return;

           const group = dataState.groups.find(g => g.id === targetGroupId);
           if (!group) return;

           const targetIndex = group.sites.findIndex(s => s.id === targetId);
           if (targetIndex === -1) return;

           const edge = extractClosestEdge(targetData);
           
           const finalIndex = edge === 'right' ? targetIndex + 1 : targetIndex;

           manager.moveSite(sourceId, targetGroupId, finalIndex);
        }
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
    <div class="group-item flex flex-col gap-4 rounded-xl border border-transparent transition-colors">
      
      <div class="flex items-center pb-3 px-1 h-10 mt-3 border-b border-border/40 cursor-default">
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
                class="relative h-full transition-opacity duration-200"
                animate:flip={{ duration: FLIP_DURATION }}
                
                use:pdndDraggable={{ 
                    type: 'site', 
                    id: item.id, 
                    groupId: group.id 
                }}
                
                use:pdndDropTarget={{ 
                    type: 'site', 
                    id: item.id, 
                    groupId: group.id,
                    isAddButton: false
                }}
            >
                <div class="h-full {appState.isEditMode ? 'pointer-events-none' : ''}">
                   <SiteCard site={item} groupId={group.id} />
                </div>

                {#if appState.isEditMode}
                    <div class="absolute inset-0 z-10 rounded-xl border border-transparent hover:border-primary/30 transition-colors pointer-events-none"></div>
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