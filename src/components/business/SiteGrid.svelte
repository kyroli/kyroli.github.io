<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
  
  const flipDurationMs = 200;

  function handleGroupDnd(e: CustomEvent<DndEvent<any>>) {
    const { items: newItems, info } = e.detail;
    dataState.groups = newItems;
    
    if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED) {
      dataState.markDirty();
    }
  }

  function handleSiteDnd(groupId: string, e: CustomEvent<DndEvent<any>>) {
    const { items: newDisplayItems, info } = e.detail;
    
    const realSites = newDisplayItems.filter((item: any) => !item.isAddBtn);
    
    const groupIndex = dataState.groups.findIndex(g => g.id === groupId);
    if (groupIndex > -1) {
        dataState.groups[groupIndex].sites = realSites;

        if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED) {
            dataState.markDirty();
        }
    }
  }

  function handleDeleteGroup(groupName: string, groupId: string) {
    appState.openConfirm({
      msg: `${MESSAGES.CONFIRM.DELETE_GROUP_PREFIX}${groupName}${MESSAGES.CONFIRM.DELETE_GROUP_SUFFIX}`,
      onConfirm: () => manager.deleteGroup(groupId),
      isDestructive: true
    });
  }

  function stopPropagation(e: Event) {
    e.stopPropagation();
  }
</script>

<div 
  class="w-full flex flex-col gap-5 pt-6 pb-0"
  use:dndzone={{
    items: dataState.groups, 
    flipDurationMs,
    dragDisabled: !appState.isEditMode, 
    type: 'group',
    dropTargetStyle: {}
  }}
  onconsider={handleGroupDnd}
  onfinalize={handleGroupDnd}
>
  
  {#each dataState.groups as group (group.id)}
    {@const displaySites = appState.isEditMode 
        ? [...group.sites, { id: `__btn_${group.id}`, isAddBtn: true, name: '', url: '', icon: '' }] 
        : group.sites
    }

    <div 
        class="group-item flex flex-col gap-4 transition-colors duration-200 rounded-xl"
        role="group"
    >
      <div class="flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40">
        {#if appState.isEditMode}
           <div 
             class="cursor-grab active:cursor-grabbing p-1.5 rounded-lg border border-border/60 hover:border-primary/50 text-text-dim hover:text-primary transition-colors touch-none bg-surface/50"
           >
             <GripHorizontal class="w-4 h-4" />
          </div>
        {/if}
        
        <div 
            class="flex-1 flex items-center min-w-0"
            onmousedown={stopPropagation} 
            ontouchstart={stopPropagation}
            role="presentation"
        >
            <h2 class="font-bold text-[11px] tracking-[0.15em] text-text-dim/60 select-none truncate uppercase">{group.name}</h2>
        </div>

        {#if appState.isEditMode}
           <div 
             class="flex gap-1 opacity-60 hover:opacity-100 transition-opacity animate-fade"
             onmousedown={stopPropagation}
             ontouchstart={stopPropagation}
             role="presentation"
           >
             <button onclick={() => appState.openGroupModal(group.id)} class="text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_RENAME_GROUP}>
               <Pencil class="w-4 h-4" />
            </button>

             <button onclick={() => handleDeleteGroup(group.name, group.id)} class="text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_DELETE_GROUP}>
               <Trash2 class="w-4 h-4" />
             </button>
           </div>
        {/if}
      </div>

      <div 
        class={`${UI_CONSTANTS.GRID_LAYOUT} content-start min-h-[72px] p-2 rounded-lg transition-colors`}
        onmousedown={stopPropagation}
        ontouchstart={stopPropagation}
        use:dndzone={{
            items: displaySites,
            flipDurationMs,
            dragDisabled: !appState.isEditMode,
            type: 'site',
            dropTargetStyle: { outline: '2px dashed var(--primary)', borderRadius: '0.5rem' }
        }}
        onconsider={(e) => handleSiteDnd(group.id, e)}
        onfinalize={(e) => handleSiteDnd(group.id, e)}
      >
          {#each displaySites as item (item.id)}
            {#if (item as any).isAddBtn}
                <div role="button" tabindex="0">
                    <button 
                        onclick={() => appState.openSiteModal(group.id)} 
                        class={`w-full flex flex-col gap-2 items-center justify-center rounded-xl border border-border/40 text-text-dim/40 hover:text-primary hover:border-primary/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer bg-surface/30 group active:scale-[0.98]`}
                        title={MESSAGES.UI.NEW_SITE}
                    >
                       <div class="w-8 h-8 rounded-full bg-surface/50 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-primary/30 group-hover:text-primary">
                           <Plus class="w-4 h-4" />
                      </div>
                    </button>
                </div>
            {:else}
                <div role="listitem">
                    <SiteCard site={item} groupId={group.id} />
                </div>
            {/if}
          {/each}
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