<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { sortable } from '$lib/actions/sortable';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import type { Group, Site } from '$lib/types';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';

  const handleSortGroups = (items: Group[]) => manager.updateGroupOrder(items);
  const handleSortSites = (gid: string, items: Site[]) => manager.updateSiteOrder(gid, items);

  const handleTransfer = (siteId: string, toGroupId: string, newIndex: number) => {
    manager.moveSite(siteId, toGroupId, newIndex);
  };

  function handleDeleteGroup(groupName: string, groupId: string) {
    appState.openConfirm({
      msg: `${MESSAGES.CONFIRM.DELETE_GROUP_PREFIX}${groupName}${MESSAGES.CONFIRM.DELETE_GROUP_SUFFIX}`,
      onConfirm: () => manager.deleteGroup(groupId),
      isDestructive: true
    });
  }
</script>

<div class="w-full flex flex-col gap-5 pt-6 pb-0"
     use:sortable={{ 
       items: dataState.groups, 
       onSort: handleSortGroups,
       disabled: !appState.isEditMode,
       handle: '.group-handle',
       draggable: '.group-item'
     }}>
  
  {#each dataState.groups as group (group.id)}
    <div class="group-item flex flex-col gap-4">
      <div class="flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40">
        {#if appState.isEditMode}
          <div class="group-handle cursor-move p-1.5 rounded-lg border border-border/60 hover:border-primary/50 text-text-dim hover:text-primary transition-colors touch-none bg-surface/50" title={MESSAGES.UI.TIP_DRAG_SORT}>
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

      <div class={`${UI_CONSTANTS.GRID_LAYOUT} content-start`}
           use:sortable={{ 
             items: group.sites, 
             group: 'sites',
             onSort: (items) => handleSortSites(group.id, items),
             onTransfer: (siteId, newIdx) => handleTransfer(siteId, group.id, newIdx),
             disabled: !appState.isEditMode,
             draggable: '.site-card' 
           }}>
        
          {#each group.sites as site (site.id)}
            <SiteCard 
                {site} 
                groupId={group.id} 
              />
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