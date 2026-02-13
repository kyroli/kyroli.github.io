<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { uiState } from '$lib/core/ui.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { Trash2, Plus, GripVertical } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { draggable, dndState } from '$lib/actions/dnd.svelte';

  const FLIP_DURATION = 300;

  const visualGroups = $derived.by(() => {
    let groups = dataState.groups.map(g => ({ 
        ...g, 
        sites: [...g.sites],
        isPlaceholder: false
    }));

    if (!dndState.isDragging) return groups;

    if (dndState.type === 'group' && dndState.draggedId) {
        const srcIdx = groups.findIndex(g => g.id === dndState.draggedId);
        let sourceGroup = null;
        if (srcIdx !== -1) [sourceGroup] = groups.splice(srcIdx, 1);

        if (sourceGroup) {
             let insertIdx = dndState.hoverIndex ?? srcIdx; 
             if (insertIdx < 0) insertIdx = 0;
             if (insertIdx > groups.length) insertIdx = groups.length;
             
             groups.splice(insertIdx, 0, { ...sourceGroup, isPlaceholder: true });
        }
    }

    if (dndState.type === 'site' && dndState.draggedId) {
        let sourceSite = null;
        for (const g of groups) {
            const idx = g.sites.findIndex(s => s.id === dndState.draggedId);
            if (idx !== -1) {
                [sourceSite] = g.sites.splice(idx, 1);
                break;
            }
        }

        if (sourceSite && dndState.hoverGroupId) {
            const targetGroup = groups.find(g => g.id === dndState.hoverGroupId);
            if (targetGroup) {
                let insertIndex = dndState.hoverIndex ?? targetGroup.sites.length;
                if (insertIndex < 0) insertIndex = 0;
                if (insertIndex > targetGroup.sites.length) insertIndex = targetGroup.sites.length;
                
                const placeholder = { ...sourceSite, isPlaceholder: true };
                targetGroup.sites.splice(insertIndex, 0, placeholder);
            }
        }
    }

    return groups;
  });

  dndState.setOnDrop((payload: any) => {
      const { type, srcId, targetGroupId, targetIndex } = payload;
      
      if (type === 'group') {
          const groupsWithoutSrc = dataState.groups.filter(g => g.id !== srcId);
          const targetGroup = groupsWithoutSrc[targetIndex];
          const targetId = targetGroup ? targetGroup.id : null;
          manager.moveGroup(srcId, targetId);
      } else if (type === 'site') {
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
      msg: `${MESSAGES.CONFIRM.DELETE_GROUP_PREFIX}${groupName}${MESSAGES.CONFIRM.DELETE_GROUP_SUFFIX}`,
      onConfirm: () => {
        manager.deleteGroup(groupId);
        appState.showToast(MESSAGES.TOAST.GROUP_DELETED, 'success');
      },
      isDestructive: true
    });
  }

  function registerRef(node: HTMLElement, id: string) {
    uiState.registerGroup(id, node);
    return {
      destroy() {
        uiState.unregisterGroup(id);
      }
    };
  }
</script>

<div class="w-full flex flex-col gap-8 pt-6 pb-0">
  {#each visualGroups as group (group.id)}
    <div 
        class="w-full transition-all"
        use:registerRef={group.id}
        data-dnd-group-id={group.id}
        animate:flip={{ duration: FLIP_DURATION, easing: cubicOut }}
    >
        {#if group.isPlaceholder}
            <div 
                class="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 transition-all box-border"
                style="height: {dndState.sourceHeight}px"
            ></div>
        {:else}
            <div class="group-item flex flex-col gap-4 relative">
                <div class="flex items-center gap-3 pb-2 h-11 border-b border-border/40 group/header justify-between">
                    {#if appState.isEditMode}
                        <button 
                            onclick={() => appState.openGroupModal(group.id)}
                            class="text-xs font-bold tracking-widest text-text-dim hover:text-primary transition-colors cursor-pointer uppercase truncate text-left opacity-80"
                            title={MESSAGES.UI.TIP_RENAME_GROUP}
                        >
                              {group.name}
                        </button>
                    {:else}
                        <h2 class="text-xs font-bold tracking-widest text-text-dim truncate uppercase opacity-80">{group.name}</h2>
                    {/if}
                    
                    <div class={`flex items-center gap-2 transition-all duration-200 ${
                        appState.isEditMode ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
                    }`}>
                        <div 
                            class="cursor-grab text-text-dim hover:text-primary active:scale-95 transition-all p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border"
                            use:draggable={{ type: 'group', id: group.id, groupId: null }}
                            title={MESSAGES.UI.TIP_DRAG_SORT}
                        >
                             <GripVertical class="w-5 h-5" />
                        </div>

                        <button 
                            onclick={() => handleDeleteGroup(group.name, group.id)} 
                            class="text-text-dim hover:text-danger hover:bg-surface p-2 rounded-lg transition-all cursor-pointer border border-transparent hover:border-border/50" 
                            title={MESSAGES.UI.TIP_DELETE_GROUP}
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
                              duration: dndState.type === 'group' ? 0 : FLIP_DURATION, 
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
    <button onclick={() => appState.openGroupModal()} class="w-full h-24 border-2 border-dashed border-border/40 rounded-2xl flex items-center justify-center gap-2 text-text-dim/40 hover:text-primary hover:border-primary/50 hover:bg-surface/30 transition-all cursor-pointer group mt-2 active:scale-[0.98] animate-fade">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>