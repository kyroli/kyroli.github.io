<script lang="ts">
import { Plus } from '@lucide/svelte';
import { flip } from 'svelte/animate';
import { cubicOut } from 'svelte/easing';
import { fade } from 'svelte/transition';
import { dndState } from '$lib/actions/dnd.svelte';
import { ANIMATION_SPEED } from '$lib/constants';
import { appState } from '$lib/core/app.svelte';
import { dataState } from '$lib/core/data.svelte';
import { MESSAGES } from '$lib/i18n';
import { manager } from '$lib/services/manager';
import type { DndPayload, VisualGroup, VisualSite } from '$lib/types';
import SiteGroup from './SiteGroup.svelte';

const visualGroups = $derived.by<VisualGroup[]>(() => {
  if (!dndState.isDragging || !dndState.draggedId) {
    return dataState.groups as VisualGroup[];
  }

  const groupsCopy = dataState.groups.slice() as VisualGroup[];

  if (dndState.type === 'group') {
    const srcIdx = groupsCopy.findIndex((g) => g.id === dndState.draggedId);
    if (srcIdx === -1) return groupsCopy;

    const [sourceGroup] = groupsCopy.splice(srcIdx, 1);
    let insertIdx = dndState.hoverIndex ?? srcIdx;
    if (insertIdx < 0) insertIdx = 0;

    groupsCopy.splice(insertIdx, 0, { ...sourceGroup, isPlaceholder: true });
    return groupsCopy;
  }

  if (dndState.type === 'site') {
    let sourceSite: VisualSite | null = null;
    let srcGroupIdx = -1;
    let srcSiteIdx = -1;

    for (let i = 0; i < groupsCopy.length; i++) {
      const siteIdx = groupsCopy[i].sites.findIndex((s) => s.id === dndState.draggedId);
      if (siteIdx !== -1) {
        srcGroupIdx = i;
        srcSiteIdx = siteIdx;
        sourceSite = groupsCopy[i].sites[siteIdx];
        break;
      }
    }

    if (!sourceSite || srcGroupIdx === -1) return groupsCopy;
    const targetGroupIdx = groupsCopy.findIndex((g) => g.id === dndState.hoverGroupId);

    groupsCopy[srcGroupIdx] = {
      ...groupsCopy[srcGroupIdx],
      sites: groupsCopy[srcGroupIdx].sites.slice()
    };
    groupsCopy[srcGroupIdx].sites.splice(srcSiteIdx, 1);
    if (targetGroupIdx !== -1) {
      if (targetGroupIdx !== srcGroupIdx) {
        groupsCopy[targetGroupIdx] = {
          ...groupsCopy[targetGroupIdx],
          sites: groupsCopy[targetGroupIdx].sites.slice()
        };
      }
      let insertIndex = dndState.hoverIndex ?? groupsCopy[targetGroupIdx].sites.length;
      if (insertIndex < 0) insertIndex = 0;

      groupsCopy[targetGroupIdx].sites.splice(insertIndex, 0, {
        ...sourceSite,
        isPlaceholder: true
      });
    }

    return groupsCopy;
  }

  return groupsCopy;
});

dndState.setOnDrop((payload: DndPayload) => {
  const { type, srcId, targetGroupId, targetIndex } = payload;

  if (type === 'group') {
    const groupsWithoutSrc = dataState.groups.filter((g) => g.id !== srcId);
    const targetGroup = groupsWithoutSrc[targetIndex];
    const targetId = targetGroup ? targetGroup.id : null;
    manager.moveGroup(srcId, targetId);
  } else if (type === 'site') {
    if (!targetGroupId) return;

    const targetGroup = dataState.groups.find((g) => g.id === targetGroupId);
    if (targetGroup) {
      let sitesWithoutSrc = targetGroup.sites;

      const srcGroupIdx = dataState.groups.findIndex((g) => g.sites.some((s) => s.id === srcId));
      const isSameGroup = dataState.groups[srcGroupIdx]?.id === targetGroupId;

      if (isSameGroup) {
        sitesWithoutSrc = targetGroup.sites.filter((s) => s.id !== srcId);
      }

      const targetSite = sitesWithoutSrc[targetIndex];
      const targetId = targetSite ? targetSite.id : null;
      manager.moveSite(srcId, targetId, targetGroupId);
    }
  }
});

function handleDeleteGroup(groupName: string, groupId: string) {
  appState.openConfirm({
    msg: MESSAGES.CONFIRM.DELETE_GROUP(groupName),
    onConfirm: () => {
      manager.deleteGroup(groupId);
      appState.showToast(MESSAGES.TOAST.GROUP_DELETED, 'success');
    },
    isDestructive: true
  });
}
</script>

<div class="w-full flex flex-col gap-6 sm:gap-8 pt-4 sm:pt-6 pb-0">
  {#each visualGroups as group (group.id)}
    <div 
        class="w-full transition-all"
        data-dnd-group-id={group.id}
        animate:flip={{ duration: ANIMATION_SPEED.FLIP, easing: cubicOut }}
    >
        {#if group.isPlaceholder}
            <div 
                class="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 transition-all box-border min-h-[72px]"
                style="height: {dndState.sourceHeight}px"
            ></div>
        {:else}
            <SiteGroup {group} onDeleteGroup={handleDeleteGroup} />
        {/if}
    </div>
  {/each}

  {#if appState.isEditMode}
    <button in:fade={{ duration: ANIMATION_SPEED.FADE_NORMAL }} onclick={() => appState.openGroupModal()} class="w-full h-24 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center gap-2 text-text-dim/40 hover:text-primary hover:border-primary/50 hover:bg-surface/30 transition-all cursor-pointer group mt-2 active-press">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>