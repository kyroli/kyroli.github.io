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

  const FLIP_DURATION = 300;

  function handleGroupHover(source, targetId) {
    if (source.type === 'group') {
        manager.swapGroups(source.id, targetId);
    }
  }

  function handleGroupDrop(source, targetId) {
    if (source.type === 'site' && source.groupId !== targetId) {
        manager.moveSite(source.id, null, targetId);
    }
  }

  function handleSiteHover(source, targetId, targetGroupId) {
    if (source.type === 'site' && source.groupId === targetGroupId) {
        manager.moveSite(source.id, targetId, targetGroupId);
    }
  }

  function handleSiteDrop(source, targetId, targetGroupId) {
    if (source.type === 'site' && source.groupId !== targetGroupId) {
        manager.moveSite(source.id, targetId, targetGroupId);
    }
  }

  function handleZoneDrop(source, targetGroupId) {
     if (source.type === 'site') {
        manager.moveSite(source.id, null, targetGroupId);
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

<div class="w-full flex flex-col gap-6 pt-6 pb-0">
  {#each dataState.groups as group (group.id)}
    <div 
        class="group-item flex flex-col gap-4 transition-all duration-300 rounded-2xl border bg-surface/30 p-2
               {appState.isEditMode ? 'border-border/60' : 'border-transparent'}
               {dndState.isDragging && dndState.type === 'site' && dndState.groupId !== group.id ? 'ring-2 ring-primary/40 bg-primary/5' : ''}
               {dndState.id === group.id ? 'opacity-20' : ''}"
        animate:flip={{ duration: FLIP_DURATION }}
        
        use:dropTarget={{ 
            type: 'group', 
            id: group.id, 
            onHover: (s) => handleGroupHover(s, group.id),
            onDrop: (s) => handleGroupDrop(s, group.id)
        }}
    >
      <div class="flex items-center h-9 cursor-default px-1">
        <div 
           class="p-1.5 mr-3 rounded-lg text-text-dim transition-all touch-none shrink-0
               {appState.isEditMode ? 'opacity-100 cursor-grab hover:bg-surface hover:text-primary active:cursor-grabbing' : 'opacity-0 pointer-events-none'}"
           use:draggable={{ type: 'group', id: group.id }}
        >
           <GripHorizontal class="w-5 h-5" />
        </div>
        
        <div class="flex-1 flex items-center min-w-0 h-full">
            <h2 class="font-bold text-xs tracking-[0.15em] text-text-dim/80 select-none truncate flex-1 uppercase pl-1">{group.name}</h2>
            
            <div class={`flex gap-1 transition-opacity animate-fade shrink-0 ml-2 ${appState.isEditMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <button onclick={() => appState.openGroupModal(group.id)} class="text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer">
                   <Pencil class="w-4 h-4" />
                </button>
                 <button onclick={() => handleDeleteGroup(group.name, group.id)} class="text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors cursor-pointer">
                    <Trash2 class="w-4 h-4" />
                 </button>
            </div>
        </div>
      </div>

      <div class="{UI_CONSTANTS.GRID_LAYOUT} content-start min-h-[72px]">
          {#each group.sites as item (item.id)}
            <div 
                class="relative h-full transition-all duration-200 select-none z-10"
                animate:flip={{ duration: FLIP_DURATION }}
                
                use:draggable={{ type: 'site', id: item.id, groupId: group.id }}
                use:dropTarget={{ 
                    type: 'site', 
                    id: item.id, 
                    groupId: group.id,
                    onHover: (s) => handleSiteHover(s, item.id, group.id),
                    onDrop: (s) => handleSiteDrop(s, item.id, group.id)
                }}
            >
                <div class="h-full transform transition-transform">
                   <SiteCard site={item} groupId={group.id} />
                </div>
            </div>
          {/each}

          {#if appState.isEditMode}
            <button 
                onclick={() => appState.openSiteModal(group.id)} 
                class={`w-full flex flex-col gap-2 items-center justify-center rounded-xl border border-dashed border-border text-text-dim/40 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer group active:scale-[0.98]`}
                title={MESSAGES.UI.NEW_SITE}
                
                use:dropTarget={{ 
                    type: 'zone', 
                    groupId: group.id, 
                    onHover: () => {}, 
                    onDrop: (s) => handleZoneDrop(s, group.id)
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