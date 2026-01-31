<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { flip } from 'svelte/animate';
  import { draggable, dropTarget, dndState } from '$lib/actions/dnd.svelte';

  const FLIP_DURATION = 200;

  const visualGroups = $derived.by(() => {
    let groups = dataState.groups.map(g => ({ ...g, sites: [...g.sites], isPlaceholder: false }));

    if (dndState.isDragging && dndState.type === 'group' && dndState.hoverId) {
        const srcIdx = groups.findIndex(g => g.id === dndState.id);
        const tgtIdx = groups.findIndex(g => g.id === dndState.hoverId);
        
        if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
             const [g] = groups.splice(srcIdx, 1);
             const newTgtIdx = groups.findIndex(g => g.id === dndState.hoverId); 
             groups.splice(newTgtIdx, 0, g);
        }
    }

    return groups.map(g => {
        let sites = g.sites.map(s => ({ ...s, isPlaceholder: false, isHidden: false }));

        if (dndState.isDragging && dndState.type === 'site') {
            if (g.id === dndState.sourceGroupId) {
                const idx = sites.findIndex(s => s.id === dndState.id);
                if (idx !== -1) {
                    sites[idx].isHidden = true;
                }
            }

            if (g.id === dndState.hoverGroupId) {
                const placeholder = { 
                    id: 'placeholder-site', 
                    name: '', url: '', icon: '', 
                    isPlaceholder: true, 
                    isHidden: false 
                };
                
                let insertIndex = sites.length;
                if (dndState.hoverId) {
                    const hoverIndex = sites.findIndex(s => s.id === dndState.hoverId);
                    if (hoverIndex !== -1) insertIndex = hoverIndex;
                }
                
                sites.splice(insertIndex, 0, placeholder);
            }
        }
        return { ...g, sites };
    });
  });

  function handleDrop(source, targetGroupId, targetId) {
    if (source.type === 'site') {
        manager.moveSite(source.id, targetId, targetGroupId);
    } else if (source.type === 'group') {
        manager.moveGroup(source.id, targetId);
    }
  }

  function handleDeleteGroup(groupName, groupId) {
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
        class="group-item flex flex-col gap-4 transition-all duration-300 relative"
        animate:flip={{ duration: FLIP_DURATION }}
        use:dropTarget={{ type: 'group', id: group.id, groupId: null, onDrop: handleDrop }}
    >
      <div class="flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40 select-none">
        <div 
           class="p-1.5 rounded-lg text-text-dim transition-all touch-none shrink-0 -ml-1.5
               {appState.isEditMode ? 'opacity-100 cursor-grab hover:bg-surface hover:text-primary active:cursor-grabbing' : 'opacity-0 pointer-events-none'}"
           use:draggable={{ type: 'group', id: group.id, groupId: null }}
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

      <div class="{UI_CONSTANTS.GRID_LAYOUT} content-start">
          {#each group.sites as item (item.id)}
             <div 
               class="relative h-full {item.isPlaceholder ? 'pointer-events-none' : 'transition-all duration-200 select-none z-10'} {item.isHidden ? 'absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none' : ''}"
               animate:flip={{ duration: FLIP_DURATION }}
               use:draggable={{ type: 'site', id: item.id, groupId: group.id }}
               use:dropTarget={{ type: 'site', id: item.id, groupId: group.id, onDrop: handleDrop }}
             >
                 {#if item.isPlaceholder}
                     <div class="{UI_CONSTANTS.CARD_HEIGHT} w-full rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 opacity-100 box-border"></div>
                 {:else}
                     <SiteCard site={item} groupId={group.id} />
                 {/if}
             </div>
          {/each}

          {#if appState.isEditMode}
            <button 
                onclick={() => appState.openSiteModal(group.id)} 
                class={`w-full flex flex-col gap-2 items-center justify-center rounded-xl border border-dashed border-border text-text-dim/40 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer group active:scale-[0.98]`}
                title={MESSAGES.UI.NEW_SITE}
                use:dropTarget={{ 
                    type: 'site', 
                    id: null, 
                    groupId: group.id, 
                    onDrop: handleDrop
                }}
            >
                <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          {/if}
      </div>
    </div>
  {/each}

  {#if appState.isEditMode}
   <button onclick={() => appState.openGroupModal()} class="w-full py-6 border-2 border-dashed border-border/40 rounded-2xl flex items-center justify-center gap-3 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/30 transition-all cursor-pointer group mt-2 active:scale-[0.99] animate-fade">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>