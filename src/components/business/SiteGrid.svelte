<script lang="ts">
  import { nav } from '$lib/nav.svelte';
  import { ui } from '$lib/ui.svelte';
  import { ICONS } from '$lib/icons';
  import { UI_CONSTANTS } from '$lib/utils';
  import { sortable } from '$lib/actions/sortable';
  import GroupModal from '../modals/GroupModal.svelte';
  import SiteCard from './SiteCard.svelte';
  
  let { onEditSite, onAddSite } = $props<{ 
    onEditSite: (gid: string, sid: string) => void,
    onAddSite: (gid: string) => void
  }>();

  let editingGroup = $state<{id?: string, name?: string} | null>(null);

  function handleTransfer(siteId: string, toGroupId: string, newIndex: number) {
    const fromGroup = nav.data.groups.find(g => g.sites.some(s => s.id === siteId));
    if (fromGroup) {
      nav.moveSite(siteId, fromGroup.id, toGroupId, newIndex);
    }
  }

  function handleDeleteGroup(groupName: string, groupId: string) {
      ui.openConfirm(`确定删除分组 "${groupName}" 及其所有站点吗？`, () => nav.deleteGroup(groupId));
  }

  const containerClass = "w-full flex flex-col gap-5 pt-6 pb-0";
  const groupItemClass = "group-item flex flex-col gap-4";
  const groupHeaderClass = "flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40";
  const groupTitleClass = "font-bold text-[11px] tracking-[0.15em] text-text-dim/60 select-none flex-1 truncate uppercase";
  const gridClass = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 content-start";
  const groupHandleClass = "group-handle cursor-move p-1.5 rounded-lg border border-border/60 hover:border-primary/50 text-text-dim hover:text-primary transition-colors touch-none bg-surface/50";
  const groupActionBtnClass = "text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer";
  const groupDeleteBtnClass = "text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors cursor-pointer";
  const addSiteBtnClass = `flex flex-col gap-2 items-center justify-center rounded-xl border border-border/40 text-text-dim/40 hover:text-primary hover:border-primary/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer bg-surface/30 group active:scale-[0.98]`;
  const addSiteIconWrapperClass = "w-8 h-8 rounded-full bg-surface/50 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-primary/30 group-hover:text-primary";
  const addGroupBtnClass = "w-full py-8 border border-border/40 rounded-3xl flex items-center justify-center gap-3 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer group mt-4 active:scale-[0.99]";
</script>

<div class={containerClass}
     use:sortable={{ 
       items: nav.data.groups, 
       onSort: (items) => nav.updateGroups(items),
       disabled: !ui.isEdit,
       handle: '.group-handle',
       draggable: '.group-item'
     }}>
  
  {#each nav.data.groups as group (group.id)}
    <div class={groupItemClass}>
      <div class={groupHeaderClass}>
        {#if ui.isEdit}
          <div class={groupHandleClass} title="拖动排序分组">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox={ICONS.drag.viewBox}>{@html ICONS.drag.path}</svg>
          </div>
        {/if}
        
        <h2 class={groupTitleClass}>{group.name}</h2>

        {#if ui.isEdit}
           <div class="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
            <button onclick={() => editingGroup = { id: group.id, name: group.name }} class={groupActionBtnClass} title="重命名分组">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox={ICONS.rename.viewBox}>{@html ICONS.rename.path}</svg>
             </button>

             <button onclick={() => handleDeleteGroup(group.name, group.id)} class={groupDeleteBtnClass} title="删除分组">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox={ICONS.delete.viewBox}>{@html ICONS.delete.path}</svg>
             </button>
           </div>
        {/if}
      </div>

      <div class={gridClass}
           use:sortable={{ 
             items: group.sites, 
             group: 'sites',
             onSort: (items) => nav.updateSites(group.id, items),
             onTransfer: (siteId, newIdx) => handleTransfer(siteId, group.id, newIdx),
             disabled: !ui.isEdit,
             draggable: '.site-card' 
           }}>
        
          {#each group.sites as site (site.id)}
             <SiteCard site={site} onEdit={() => onEditSite(group.id, site.id)} />
          {/each}
        
          {#if ui.isEdit}
            <button onclick={() => onAddSite(group.id)} class={addSiteBtnClass}>
              <div class={addSiteIconWrapperClass}>
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox={ICONS.add.viewBox}>{@html ICONS.add.path}</svg>
              </div>
            </button>
          {/if}
       </div>
    </div>
  {/each}

  {#if ui.isEdit}
   <button onclick={() => editingGroup = {}} class={addGroupBtnClass}>
      <svg class="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox={ICONS.add.viewBox}>{@html ICONS.add.path}</svg>
      <span class="font-bold text-sm tracking-widest">新建分组</span>
    </button>
  {/if}

  {#if editingGroup}
    <GroupModal groupId={editingGroup.id} initialName={editingGroup.name} onClose={() => editingGroup = null} />
  {/if}
</div>