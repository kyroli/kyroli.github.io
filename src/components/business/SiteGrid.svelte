<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { flip } from 'svelte/animate';

  const FLIP_DURATION = 300;

  let draggingType = $state<'group' | 'site' | null>(null);
  let draggingId = $state<string | null>(null);
  let draggingGroupId = $state<string | null>(null);
  let isGroupHandleActive = false;

  function handleGroupDragStart(e: DragEvent, id: string) {
    if (!isGroupHandleActive) {
      e.preventDefault();
      return;
    }
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

  function handleDragEnd() {
    draggingType = null;
    draggingId = null;
    draggingGroupId = null;
    isGroupHandleActive = false;
    dataState.markDirty();
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

<svelte:window onmouseup={() => isGroupHandleActive = false} />

<div class="w-full flex flex-col gap-5 pt-6 pb-0">
  
  {#each dataState.groups as group (group.id)}
    <div 
        class="group-item flex flex-col gap-4 transition-colors duration-200 rounded-xl
               {draggingType === 'group' && draggingId === group.id ? 'opacity-40 scale-[0.99]' : ''}"
        animate:flip={{ duration: FLIP_DURATION }}
        
        draggable={appState.isEditMode}
        ondragstart={(e) => handleGroupDragStart(e, group.id)}
        ondragenter={() => handleGroupDragEnter(group.id)}
        ondragend={handleDragEnd}
        ondragover={handleDragOver}
    >
      <div 
        class="flex items-center pb-3 px-1 h-10 mt-3 border-b border-border/40 cursor-default"
        onmousedown={(e) => e.stopPropagation()} 
        role="presentation"
      >
        {#if appState.isEditMode}
           <div 
             class="cursor-grab active:cursor-grabbing p-1.5 mr-3 rounded-lg border border-border/60 hover:border-primary/50 text-text-dim hover:text-primary transition-colors touch-none bg-surface/50 shrink-0"
             onmousedown={() => isGroupHandleActive = true}
             role="button"
             tabindex="0"
           >
             <GripHorizontal class="w-4 h-4" />
          </div>
        {/if}
        
        <div class="flex-1 flex items-center min-w-0 h-full">
            <h2 class="font-bold text-[11px] tracking-[0.15em] text-text-dim/60 select-none truncate uppercase flex-1">{group.name}</h2>
            
            {#if appState.isEditMode}
               <div class="flex gap-1 opacity-60 hover:opacity-100 transition-opacity animate-fade shrink-0">
                 <button onclick={() => appState.openGroupModal(group.id)} class="text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_RENAME_GROUP}>
                   <Pencil class="w-4 h-4" />
                </button>
                 <button onclick={() => handleDeleteGroup(group.name, group.id)} class="text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_DELETE_GROUP}>
                   <Trash2 class="w-4 h-4" />
                 </button>
               </div>
            {/if}
        </div>
      </div>

      <div 
        class="{UI_CONSTANTS.GRID_LAYOUT} content-start min-h-[72px] p-2 rounded-lg transition-colors"
        ondragover={handleDragOver} 
        role="list"
      >
          {#each group.sites as item (item.id)}
            <div 
                role="listitem"
                class="relative h-full" 
                
                animate:flip={{ duration: FLIP_DURATION }}
                
                draggable={appState.isEditMode}
                ondragstart={(e) => handleSiteDragStart(e, item.id, group.id)}
                ondragenter={() => handleSiteDragEnter(item.id, group.id)}
                ondragend={handleDragEnd}
                
                style="opacity: {draggingType === 'site' && draggingId === item.id ? '0.4' : '1'}; transition: opacity 0.2s;"
            >
                <SiteCard site={item} groupId={group.id} />
                
                {#if appState.isEditMode}
                    <div class="absolute inset-0 z-10 cursor-grab active:cursor-grabbing rounded-xl"></div>
                {/if}
            </div>
          {/each}

          {#if appState.isEditMode}
            <button 
                onclick={() => appState.openSiteModal(group.id)} 
                class={`w-full flex flex-col gap-2 items-center justify-center rounded-xl border border-border/40 text-text-dim/40 hover:text-primary hover:border-primary/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer bg-surface/30 group active:scale-[0.98]`}
                title={MESSAGES.UI.NEW_SITE}
                ondragenter={(e) => e.preventDefault()}
            >
                <div class="w-8 h-8 rounded-full bg-surface/50 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-primary/30 group-hover:text-primary">
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