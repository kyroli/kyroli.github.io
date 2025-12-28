<script lang="ts">
  import { UI_CONSTANTS, ANIMATION_SPEED } from '$lib/constants';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { Trash2, Plus, GripVertical } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { draggable, dndState } from '$lib/actions/dnd.svelte';
  import type { DndPayload, Group, Site } from '$lib/types';
  import { tooltip } from '$lib/actions/tooltip';
  import { fade } from 'svelte/transition';

  type VisualSite = Site & { isPlaceholder?: boolean };
  type VisualGroup = Group & { isPlaceholder?: boolean, sites: VisualSite[] };
  
  const visualGroups = $derived.by<VisualGroup[]>(() => {
    if (!dndState.isDragging || !dndState.draggedId) {
        return dataState.groups as VisualGroup[];
    }

    const groupsCopy = dataState.groups.slice() as VisualGroup[];

    if (dndState.type === 'group') {
        const srcIdx = groupsCopy.findIndex(g => g.id === dndState.draggedId);
        if (srcIdx === -1) return groupsCopy;

        const [sourceGroup] = groupsCopy.splice(srcIdx, 1);
        let insertIdx = dndState.hoverIndex ?? srcIdx;
        if (insertIdx < 0) insertIdx = 0;

        groupsCopy.splice(insertIdx, 0, { ...sourceGroup, isPlaceholder: true });
        return groupsCopy;
    }

    if (dndState.type === 'site') {
        let sourceSite: VisualSite | null = null;
        let srcGroupIdx = -1;
        let srcSiteIdx = -1;

        for (let i = 0; i < groupsCopy.length; i++) {
            const siteIdx = groupsCopy[i].sites.findIndex(s => s.id === dndState.draggedId);
            if (siteIdx !== -1) {
                srcGroupIdx = i;
                srcSiteIdx = siteIdx;
                sourceSite = groupsCopy[i].sites[siteIdx];
                break;
            }
        }

        if (!sourceSite || srcGroupIdx === -1) return groupsCopy;
        const targetGroupIdx = groupsCopy.findIndex(g => g.id === dndState.hoverGroupId);

        groupsCopy[srcGroupIdx] = { ...groupsCopy[srcGroupIdx], sites: groupsCopy[srcGroupIdx].sites.slice() };
        groupsCopy[srcGroupIdx].sites.splice(srcSiteIdx, 1);
        if (targetGroupIdx !== -1) {
            if (targetGroupIdx !== srcGroupIdx) {
                 groupsCopy[targetGroupIdx] = { ...groupsCopy[targetGroupIdx], sites: groupsCopy[targetGroupIdx].sites.slice() };
            }
            let insertIndex = dndState.hoverIndex ?? groupsCopy[targetGroupIdx].sites.length;
            if (insertIndex < 0) insertIndex = 0;

            groupsCopy[targetGroupIdx].sites.splice(insertIndex, 0, { ...sourceSite, isPlaceholder: true });
        }

        return groupsCopy;
    }

    return groupsCopy;
  });

  dndState.setOnDrop((payload: DndPayload) => {
      const { type, srcId, targetGroupId, targetIndex } = payload;
      
      if (type === 'group') {
          const groupsWithoutSrc = dataState.groups.filter(g => g.id !== srcId);
          const targetGroup = groupsWithoutSrc[targetIndex];
          const targetId = targetGroup ? targetGroup.id : null;
          manager.moveGroup(srcId, targetId);
      } else if (type === 'site') {
          if (!targetGroupId) return;

          const targetGroup = dataState.groups.find(g => g.id === targetGroupId);
          if (targetGroup) {
              let sitesWithoutSrc = targetGroup.sites;
              
              const srcGroupIdx = dataState.groups.findIndex(g => g.sites.some(s => s.id === srcId));
              const isSameGroup = dataState.groups[srcGroupIdx]?.id === targetGroupId;
              
              if (isSameGroup) {
                  sitesWithoutSrc = targetGroup.sites.filter(s => s.id !== srcId);
              }

              const targetSite = sitesWithoutSrc[targetIndex];
              const targetId = targetSite ? targetSite.id : null;
              manager.moveSite(srcId, targetId, targetGroupId);
          }
      }
  });

  function handleDeleteGroup(groupName: string, groupId: string) {
    appState.openConfirm({
      msg: MESSAGES.CONFIRM.DELETE_GROUP(groupName),
      onConfirm: () => {
        manager.deleteGroup(groupId);
        appState.showToast(MESSAGES.TOAST.GROUP_DELETED, 'success');
      },
      isDestructive: true
    });
  }
</script>

<div class="w-full flex flex-col gap-6 sm:gap-8 pt-4 sm:pt-6 pb-0">
  {#each visualGroups as group (group.id)}
    <div 
        class="w-full transition-all"
        data-dnd-group-id={group.id}
        animate:flip={{ duration: ANIMATION_SPEED.FLIP, easing: cubicOut }}
    >
        {#if group.isPlaceholder}
            <div 
                class="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 transition-all box-border min-h-[72px]"
                style="height: {dndState.sourceHeight}px"
            ></div>
        {:else}
            <div class="group-item flex flex-col gap-4 relative">
                <div class="flex items-center gap-3 pb-2 h-11 border-b border-border/40 group/header justify-between">
                    {#if appState.isEditMode}
                        <button 
                            onclick={() => appState.openGroupModal(group.id)}
                            class="text-xs font-bold tracking-widest text-text-dim hover:text-primary transition-colors cursor-pointer uppercase truncate text-left opacity-80"
                            use:tooltip={MESSAGES.UI.TIP_RENAME_GROUP}
                        >
                              {group.name}
                        </button>
                    {:else}
                        <h2 class="text-xs font-bold tracking-widest text-text-dim uppercase opacity-80">{group.name}</h2>
                    {/if}
                    
                    <div class={`flex items-center gap-2 transition-all duration-200 ${
                        appState.isEditMode ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
                    }`}>
                        <div 
                            class="cursor-grab text-text-dim hover:text-primary active:scale-95 transition-all p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border"
                            use:draggable={{ type: 'group', id: group.id, groupId: null }}
                            use:tooltip={MESSAGES.UI.TIP_DRAG_SORT}
                        >
                            <GripVertical class="w-5 h-5" />
                        </div>

                        <button 
                            onclick={() => handleDeleteGroup(group.name, group.id)} 
                            class="text-text-dim hover:text-danger hover:bg-surface p-2 rounded-lg transition-all cursor-pointer border border-transparent hover:border-border/50 active-press-icon" 
                            use:tooltip={MESSAGES.UI.TIP_DELETE_GROUP}
                        >
                            <Trash2 class="w-5 h-5" />
                        </button>
                    </div>
                </div>

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
        {/if}
    </div>
  {/each}

  {#if appState.isEditMode}
    <button in:fade={{ duration: ANIMATION_SPEED.FADE_NORMAL }} onclick={() => appState.openGroupModal()} class="w-full h-24 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center gap-2 text-text-dim/40 hover:text-primary hover:border-primary/50 hover:bg-surface/30 transition-all cursor-pointer group mt-2 active-press">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>