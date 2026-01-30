<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { sortable } from '$lib/actions/sortable';
  import { nav } from '$lib/nav.svelte';
  import { ui } from '$lib/ui.svelte';
  import { MESSAGES } from '$lib/i18n';
  import type { Group } from '$lib/types';
  
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import GroupModal from '../modals/GroupModal.svelte';
  import SiteCard from './SiteCard.svelte';

  let { groups } = $props<{ groups: Group[] }>();
  let editingGroup = $state<{id?: string, name?: string} | null>(null);

  const handleSortGroups = (items: Group[]) => nav.updateGroups(items);
  const handleSortSites = (gid: string, items: any[]) => nav.updateSites(gid, items);
  const handleTransfer = (siteId: string, toGroupId: string, newIndex: number) => {
    const fromGroup = nav.data.groups.find(g => g.sites.some(s => s.id === siteId));
    if (fromGroup) {
        nav.moveSite(siteId, fromGroup.id, toGroupId, newIndex);
    }
  };
  function handleDeleteGroupClick(groupName: string, groupId: string) {
      ui.openConfirm(
        `${MESSAGES.CONFIRM.DELETE_GROUP_PREFIX}${groupName}${MESSAGES.CONFIRM.DELETE_GROUP_SUFFIX}`, 
        () => nav.deleteGroup(groupId)
      );
  }

  function handleSiteDelete(groupId: string, siteId: string) {
    ui.openConfirm(MESSAGES.CONFIRM.DELETE_SITE, () => {
      nav.deleteSite(groupId, siteId);
    });
  }

  function handleSiteEdit(groupId: string, siteId: string) {
    ui.openSiteModal(groupId, siteId);
  }
</script>

<div class="w-full flex flex-col gap-5 pt-6 pb-0"
     use:sortable={{ 
       items: groups, 
       onSort: handleSortGroups,
       disabled: !ui.isEdit,
       handle: '.group-handle',
       draggable: '.group-item'
     }}>
  
  {#each groups as group (group.id)}
    <div class="group-item flex flex-col gap-4">
      <div class="flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40">
        {#if ui.isEdit}
         <div class="group-handle cursor-move p-1.5 rounded-lg border border-border/60 hover:border-primary/50 text-text-dim hover:text-primary transition-colors touch-none bg-surface/50" title={MESSAGES.UI.TIP_DRAG_SORT}>
             <GripHorizontal class="w-4 h-4" />
          </div>
        {/if}
        
        <h2 class="font-bold text-[11px] tracking-[0.15em] text-text-dim/60 select-none flex-1 truncate uppercase">{group.name}</h2>

        {#if ui.isEdit}
           <div class="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
            <button onclick={() => editingGroup = { id: group.id, name: group.name }} class="text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_RENAME_GROUP}>
               <Pencil class="w-4 h-4" />
             </button>

             <button onclick={() => handleDeleteGroupClick(group.name, group.id)} class="text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors cursor-pointer" title={MESSAGES.UI.TIP_DELETE_GROUP}>
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
             disabled: !ui.isEdit,
             draggable: '.site-card' 
           }}>
        
          {#each group.sites as site (site.id)}
             <SiteCard 
                site={site} 
                groupId={group.id} 
                isEdit={ui.isEdit}
                onDelete={handleSiteDelete}
                onEdit={handleSiteEdit}
              />
          {/each}
        
          {#if ui.isEdit}
            <button onclick={() => ui.openSiteModal(group.id)} class={`flex flex-col gap-2 items-center justify-center rounded-xl border border-border/40 text-text-dim/40 hover:text-primary hover:border-primary/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer bg-surface/30 group active:scale-[0.98]`}>
               <div class="w-8 h-8 rounded-full bg-surface/50 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-primary/30 group-hover:text-primary">
                  <Plus class="w-4 h-4" />
              </div>
            </button>
          {/if}
       </div>
    </div>
  {/each}

  {#if ui.isEdit}
   <button onclick={() => editingGroup = {}} class="w-full py-8 border border-border/40 rounded-3xl flex items-center justify-center gap-3 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer group mt-4 active:scale-[0.99]">
      <Plus class="w-6 h-6 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}

  {#if editingGroup}
    <GroupModal 
      groupId={editingGroup.id} 
      initialName={editingGroup.name} 
      onClose={() => editingGroup = null}
    />
  {/if}
</div>