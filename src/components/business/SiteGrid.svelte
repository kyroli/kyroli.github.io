<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  const FLIP_DURATION = 300;

  let draggingType = $state<'group' | 'site' | null>(null);
  let draggingId = $state<string | null>(null);
  let draggingGroupId = $state<string | null>(null);
  
  function handleGroupDragStart(e: DragEvent, id: string) {
    draggingType = 'group';
    draggingId = id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleGroupDragEnter(targetGroupId: string) {
    if (draggingType !== 'group' || draggingId === targetGroupId || !draggingId) return;

    const groups = dataState.groups;
    const fromIndex = groups.findIndex(g => g.id === draggingId);
    const toIndex = groups.findIndex(g => g.id === targetGroupId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const item = groups[fromIndex];
      groups.splice(fromIndex, 1);
      groups.splice(toIndex, 0, item);
    }
  }

  function handleDragEnd() {
    draggingType = null;
    draggingId = null;
    draggingGroupId = null;
    dataState.markDirty();
  }

  function handleSiteDragStart(e: DragEvent, siteId: string, groupId: string) {
    draggingType = 'site';
    draggingId = siteId;
    draggingGroupId = groupId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
    e.stopPropagation();
  }

  function handleSiteDragEnter(targetSiteId: string, targetGroupId: string) {
    if (draggingType !== 'site' || !draggingId || !draggingGroupId) return;
    if (draggingId === targetSiteId) return;
    if (draggingGroupId !== targetGroupId) return;

    const groupIndex = dataState.groups.findIndex(g => g.id === targetGroupId);
    if (groupIndex === -1) return;

    const sites = dataState.groups[groupIndex].sites;
    const fromIndex = sites.findIndex(s => s.id === draggingId);
    const toIndex = sites.findIndex(s => s.id === targetSiteId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const item = sites[fromIndex];
      sites.splice(fromIndex, 1);
      sites.splice(toIndex, 0, item);
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
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

<div class="w-full flex flex-col gap-6 pt-6 pb-20">
  
  {#each dataState.groups as group (group.id)}
    <div 
        class="group-item flex flex-col bg-surface/30 rounded-2xl border border-transparent transition-colors duration-200 pb-2
               {appState.isEditMode ? 'border-border/40 hover:border-primary/20' : ''}
               {draggingType === 'group' && draggingId === group.id ? 'opacity-50 scale-[0.98]' : ''}"
        animate:flip={{ duration: FLIP_DURATION }}
        
        draggable={appState.isEditMode}
        ondragstart={(e) => handleGroupDragStart(e, group.id)}
        ondragenter={() => handleGroupDragEnter(group.id)}
        ondragend={handleDragEnd}
        ondragover={handleDragOver}
    >
      <div 
        class="flex items-center px-4 py-3 border-b border-border/40 min-h-[50px] cursor-default"
        onmousedown={(e) => e.stopPropagation()} 
      >
        {#if appState.isEditMode}
           <div 
             class="cursor-grab active:cursor-grabbing p-2 mr-3 rounded-lg hover:bg-surface text-text-dim hover:text-primary transition-colors touch-none"
             onmousedown={(e) => { 
             }}
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
        ondragover={handleDragOver} 
      >
          {#each group.sites as item (item.id)}
            <div 
                role="listitem"
                class="relative"
                
                animate:flip={{ duration: FLIP_DURATION }}
                
                draggable={appState.isEditMode}
                ondragstart={(e) => handleSiteDragStart(e, item.id, group.id)}
                ondragenter={() => handleSiteDragEnter(item.id, group.id)}
                ondragend={handleDragEnd}
                
                style="opacity: {draggingType === 'site' && draggingId === item.id ? '0' : '1'}"
            >
                <SiteCard site={item} groupId={group.id} />
                
                {#if appState.isEditMode}
                    <div class="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"></div>
                {/if}
            </div>
          {/each}

          {#if appState.isEditMode}
            <button 
                onclick={() => appState.openSiteModal(group.id)} 
                class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/40 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer active:scale-[0.98] group h-full min-h-[100px]"
                title={MESSAGES.UI.NEW_SITE}
                ondragenter={(e) => {
                    e.preventDefault();
                }}
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