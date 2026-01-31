<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { flip } from 'svelte/animate';

  let draggingType = $state<'GROUP' | 'SITE' | null>(null);
  let draggingId = $state<string | null>(null);
  let sourceGroupId = $state<string | null>(null);
  let dragOverGroupId = $state<string | null>(null);

  function handleDragStart(e: DragEvent, type: 'GROUP' | 'SITE', id: string, groupId?: string) {
    if (!appState.isEditMode) {
        e.preventDefault();
        return;
    }
    draggingType = type;
    draggingId = id;
    sourceGroupId = groupId || null;
    
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e: DragEvent, targetType: 'GROUP' | 'SITE', targetId?: string, targetGroupId?: string) {
    e.preventDefault();
    if (!appState.isEditMode || !draggingId || !draggingType) return;
    
    if (draggingType === 'GROUP' && targetType === 'GROUP' && targetId && targetId !== draggingId) {
        const fromIdx = dataState.groups.findIndex(g => g.id === draggingId);
        const toIdx = dataState.groups.findIndex(g => g.id === targetId);
        
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
            const item = dataState.groups[fromIdx];
            dataState.groups.splice(fromIdx, 1);
            dataState.groups.splice(toIdx, 0, item);
        }
    }

    if (draggingType === 'SITE') {
        dragOverGroupId = targetGroupId || null;
        
        if (targetType === 'SITE' && targetId && targetGroupId && draggingId !== targetId) {
             const fromGroup = dataState.groups.find(g => g.sites.some(s => s.id === draggingId));
             const toGroup = dataState.groups.find(g => g.id === targetGroupId);
             
             if (fromGroup && toGroup) {
                 const fromSiteIdx = fromGroup.sites.findIndex(s => s.id === draggingId);
                 const toSiteIdx = toGroup.sites.findIndex(s => s.id === targetId);
                 
                 if (fromSiteIdx !== -1) {
                     const [site] = fromGroup.sites.splice(fromSiteIdx, 1);
                     toGroup.sites.splice(toSiteIdx, 0, site);
                 }
             }
        } else if (targetType === 'GROUP' && targetId) {
             const fromGroup = dataState.groups.find(g => g.sites.some(s => s.id === draggingId));
             const toGroup = dataState.groups.find(g => g.id === targetId);

             if (fromGroup && toGroup && fromGroup.id !== toGroup.id) {
                 const fromSiteIdx = fromGroup.sites.findIndex(s => s.id === draggingId);
                 if (fromSiteIdx !== -1) {
                     const [site] = fromGroup.sites.splice(fromSiteIdx, 1);
                     toGroup.sites.push(site);
                 }
             }
        }
    }
  }

  function handleDrop(e: DragEvent) {
      e.preventDefault();
      draggingType = null;
      draggingId = null;
      sourceGroupId = null;
      dragOverGroupId = null;
      dataState.markDirty();
  }

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
        class="group-item flex flex-col gap-4 transition-colors duration-200 rounded-xl"
        role="group"
        animate:flip={{duration: 250}}
        draggable={appState.isEditMode && draggingType !== 'SITE'}
        ondragstart={(e) => handleDragStart(e, 'GROUP', group.id)}
        ondragover={(e) => handleDragOver(e, 'GROUP', group.id)}
        ondrop={handleDrop}
        class:opacity-50={draggingType === 'GROUP' && draggingId === group.id}
        class:bg-surface-5={draggingType === 'SITE' && dragOverGroupId === group.id}
    >
      <div class="flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40">
        {#if appState.isEditMode}
           <div class="cursor-move p-1.5 rounded-lg border border-border/60 hover:border-primary/50 text-text-dim hover:text-primary transition-colors touch-none bg-surface/50">
             <GripHorizontal class="w-4 h-4" />
          </div>
        {/if}
        
        <h2 class="font-bold text-[11px] tracking-[0.15em] text-text-dim/60 select-none flex-1 truncate uppercase">{group.name}</h2>

        {#if appState.isEditMode}
           <div class="flex gap-1 opacity-60 hover:opacity-100 transition-opacity animate-fade">
             <button onclick={() => appState.openGroupModal(group.id)} class="text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_RENAME_GROUP}>
               <Pencil class="w-4 h-4" />
             </button>

             <button onclick={() => handleDeleteGroup(group.name, group.id)} class="text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_DELETE_GROUP}>
               <Trash2 class="w-4 h-4" />
             </button>
           </div>
        {/if}
      </div>

      <div class={`${UI_CONSTANTS.GRID_LAYOUT} content-start min-h-[80px] p-2 rounded-lg transition-colors`}>
          {#each group.sites as site (site.id)}
            <div
                animate:flip={{duration: 250}}
                draggable={appState.isEditMode}
                ondragstart={(e) => handleDragStart(e, 'SITE', site.id, group.id)}
                ondragover={(e) => handleDragOver(e, 'SITE', site.id, group.id)}
                ondrop={handleDrop}
                class:opacity-40={draggingType === 'SITE' && draggingId === site.id}
                role="listitem"
            >
                <SiteCard {site} groupId={group.id} />
            </div>
          {/each}
        
          {#if appState.isEditMode}
            <button onclick={() => appState.openSiteModal(group.id)} class={`flex flex-col gap-2 items-center justify-center rounded-xl border border-border/40 text-text-dim/40 hover:text-primary hover:border-primary/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer bg-surface/30 group active:scale-[0.98]`}>
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