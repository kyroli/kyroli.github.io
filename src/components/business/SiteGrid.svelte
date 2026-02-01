<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { flip } from 'svelte/animate';
  import { draggable, dndState } from '$lib/actions/dnd.svelte';

  const FLIP_DURATION = 300;
  
  const visualGroups = $derived.by(() => {
    let groups = dataState.groups.map(g => ({ 
        ...g, 
        sites: [...g.sites],
        isPlaceholder: false,
        isActive: false 
    }));

    if (!dndState.isDragging) return groups;

    if (dndState.type === 'group') {
        const srcIdx = groups.findIndex(g => g.id === dndState.draggedId);
        
        let sourceGroup = null;
        if (srcIdx !== -1) {
            sourceGroup = groups[srcIdx];
            groups.splice(srcIdx, 1);
        }

        if (sourceGroup) {
             let insertIdx = srcIdx; 
             if (dndState.hoverId) {
                 const foundIdx = groups.findIndex(g => g.id === dndState.hoverId);
                 if (foundIdx !== -1) {
                     insertIdx = foundIdx;
                 }
             } else {
                 insertIdx = groups.length;
             }
             groups.splice(insertIdx, 0, { ...sourceGroup, isPlaceholder: true });
        }
    }

    if (dndState.type === 'site') {
        let sourceSite = null;
        for (const g of groups) {
            const idx = g.sites.findIndex(s => s.id === dndState.draggedId);
            if (idx !== -1) {
                [sourceSite] = g.sites.splice(idx, 1);
                break;
            }
        }

        if (sourceSite) {
            const placeholder = { ...sourceSite, isPlaceholder: true };
            const targetGroup = groups.find(g => g.id === dndState.hoverGroupId);
            
            if (targetGroup) {
                let insertIndex = targetGroup.sites.length;
                if (dndState.hoverId) {
                    const hoverIdx = targetGroup.sites.findIndex(s => s.id === dndState.hoverId);
                    if (hoverIdx !== -1) insertIndex = hoverIdx;
                }
                targetGroup.sites.splice(insertIndex, 0, placeholder);
            }
        }
    }

    return groups;
  });

  dndState.setOnDrop((payload: any) => {
      const { type, srcId, targetGroupId, targetId } = payload;
      
      if (type === 'site') {
          manager.moveSite(srcId, targetId, targetGroupId);
      } else if (type === 'group') {
          if (targetId && targetId !== srcId) {
              manager.moveGroup(srcId, targetId);
          }
      }
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
  {#each visualGroups as group (group.id)}
    <div 
        animate:flip={{ duration: FLIP_DURATION }}
        data-dnd-group-id={group.id}
        class="w-full transition-all duration-300"
    >
        {#if group.isPlaceholder}
            <div 
                class="w-full rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 animate-pulse"
                style="height: {dndState.draggedHeight}px"
            ></div>
        {:else}
            <div class="group-item flex flex-col gap-4 relative">
                <div class="flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40 select-none">
                    <div 
                        class="w-8 h-8 flex items-center justify-center rounded-xl border border-border/60 bg-surface/50 text-text-dim transition-all touch-none shrink-0 -ml-1
                        {appState.isEditMode ? 'opacity-100 cursor-move hover:border-primary/50 hover:text-primary active:scale-95' : 'opacity-0 pointer-events-none'}"
                        use:draggable={{ type: 'group', id: group.id, groupId: null }}
                        title={MESSAGES.UI.TIP_DRAG_SORT}
                    >
                        <GripHorizontal class="w-5 h-5" />
                    </div>
                    
                    <div class="flex-1 flex items-center min-w-0 h-full">
                        <h2 class="font-bold text-xs tracking-[0.15em] text-text-dim/80 select-none truncate flex-1 uppercase">{group.name}</h2>
                        <div class={`flex gap-1 transition-opacity animate-fade shrink-0 ml-2 ${appState.isEditMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <button onclick={() => appState.openGroupModal(group.id)} class="text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_RENAME_GROUP}>
                                <Pencil class="w-4 h-4" />
                            </button>
                            <button onclick={() => handleDeleteGroup(group.name, group.id)} class="text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_DELETE_GROUP}>
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div class="{UI_CONSTANTS.GRID_LAYOUT} content-start min-h-[72px]">
                     {#each group.sites as item (item.id)}
                        <div 
                        class="relative h-full transition-all duration-200 z-10"
                        animate:flip={{ duration: FLIP_DURATION }}
                        data-dnd-site-id={item.id}
                        >
                            {#if item.isPlaceholder}
                                <div class="{UI_CONSTANTS.CARD_HEIGHT} w-full rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 box-border animate-pulse"></div>
                            {:else}
                                <div use:draggable={{ type: 'site', id: item.id, groupId: group.id }} class="h-full">
                                    <SiteCard site={item} groupId={group.id} />
                                </div>
                            {/if}
                        </div>
                     {/each}

                    {#if appState.isEditMode}
                        <button 
                            onclick={() => appState.openSiteModal(group.id)} 
                            class={`w-full flex flex-col gap-2 items-center justify-center rounded-xl border-2 border-dashed border-border/40 text-text-dim/40 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer group active:scale-[0.98]`}
                            title={MESSAGES.UI.NEW_SITE}
                        >
                            <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
  {/each}

  {#if appState.isEditMode}
   <button onclick={() => appState.openGroupModal()} class="w-full py-6 border-2 border-dashed border-border/40 rounded-2xl flex items-center justify-center gap-3 text-text-dim/40 hover:text-primary hover:border-primary/50 hover:bg-surface/30 transition-all cursor-pointer group mt-2 active:scale-[0.98] animate-fade">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>