<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { flip } from 'svelte/animate';
  import { draggable, dndState } from '$lib/actions/dnd.svelte';

  const FLIP_DURATION = 250;

  // 核心逻辑：根据拖拽状态计算视觉上的列表（包含占位符和避让逻辑）
  const visualGroups = $derived.by(() => {
    // 1. 深拷贝原始数据，避免污染
    let groups = dataState.groups.map(g => ({ 
        ...g, 
        sites: [...g.sites],
        isPlaceholder: false,
        isActive: false // 标记是否是被拖拽的分组
    }));

    if (!dndState.isDragging) return groups;

    // --- 分组排序预览 ---
    if (dndState.type === 'group') {
        const srcIdx = groups.findIndex(g => g.id === dndState.draggedId);
        // 标记源分组（用于隐藏原身）
        if (srcIdx !== -1) groups[srcIdx].isActive = true;

        if (dndState.hoverId && dndState.hoverId !== dndState.draggedId) {
             const tgtIdx = groups.findIndex(g => g.id === dndState.hoverId);
             if (srcIdx !== -1 && tgtIdx !== -1) {
                 const [g] = groups.splice(srcIdx, 1);
                 // 重新插入到目标位置
                 groups.splice(tgtIdx, 0, g);
             }
        }
    }

    // --- 网站卡片排序预览 ---
    if (dndState.type === 'site') {
        // 先移除源卡片
        let sourceSite = null;
        for (const g of groups) {
            const idx = g.sites.findIndex(s => s.id === dndState.draggedId);
            if (idx !== -1) {
                [sourceSite] = g.sites.splice(idx, 1);
                break;
            }
        }

        // 再插入占位符
        if (sourceSite) {
            // 构造占位符对象
            const placeholder = { ...sourceSite, isPlaceholder: true };
            
            // 找到目标分组
            const targetGroup = groups.find(g => g.id === dndState.hoverGroupId);
            
            if (targetGroup) {
                let insertIndex = targetGroup.sites.length; // 默认末尾
                
                if (dndState.hoverId) {
                    const hoverIdx = targetGroup.sites.findIndex(s => s.id === dndState.hoverId);
                    if (hoverIdx !== -1) insertIndex = hoverIdx;
                }
                
                targetGroup.sites.splice(insertIndex, 0, placeholder);
            }
        }
    }

    return groups;
  });

  // 注册回调：处理真实的逻辑变更
  dndState.setOnDrop((payload: any) => {
      const { type, srcId, targetGroupId, targetId } = payload;
      
      if (type === 'site') {
          manager.moveSite(srcId, targetId, targetGroupId);
      } else if (type === 'group') {
          if (targetId && targetId !== srcId) {
              manager.moveGroup(srcId, targetId);
          }
      }
  });

  function handleDeleteGroup(groupName: string, groupId: string) {
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
        data-dnd-group-id={group.id}
    >
      <div class="flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40 select-none">
        <div 
           class="p-1.5 rounded-lg text-text-dim transition-all touch-none shrink-0 -ml-1.5
               {appState.isEditMode ? 'opacity-100 hover:bg-surface hover:text-primary active:scale-95' : 'opacity-0 pointer-events-none'} 
               {group.isActive ? 'opacity-0' : ''}"
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

      <div class="{UI_CONSTANTS.GRID_LAYOUT} content-start min-h-[72px]">
          {#each group.sites as item (item.id)}
             <div 
               class="relative h-full transition-all duration-200 z-10"
               animate:flip={{ duration: FLIP_DURATION }}
               data-dnd-site-id={item.id}
             >
                 {#if item.isPlaceholder}
                     <div class="{UI_CONSTANTS.CARD_HEIGHT} w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 box-border animate-pulse"></div>
                 {:else}
                     <div use:draggable={{ type: 'site', id: item.id, groupId: group.id }} class="h-full">
                        <SiteCard site={item} groupId={group.id} />
                     </div>
                 {/if}
             </div>
          {/each}

          {#if appState.isEditMode}
            <button 
                onclick={() => appState.openSiteModal(group.id)} 
                class={`w-full flex flex-col gap-2 items-center justify-center rounded-xl border border-dashed border-border text-text-dim/40 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all ${UI_CONSTANTS.CARD_HEIGHT} cursor-pointer group active:scale-[0.98]`}
                title={MESSAGES.UI.NEW_SITE}
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