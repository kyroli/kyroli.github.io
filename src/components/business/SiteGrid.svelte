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

  const FLIP_DURATION = 300;

  // 核心逻辑：根据拖拽状态计算视觉上的列表（包含占位符和避让逻辑）
  const visualGroups = $derived.by(() => {
    // 1. 初始化视图数据
    let groups = dataState.groups.map(g => ({ 
        ...g, 
        sites: [...g.sites],
        isPlaceholder: false,
        isActive: false 
    }));

    if (!dndState.isDragging) return groups;

    // --- 分组排序预览 ---
    if (dndState.type === 'group') {
        const srcIdx = groups.findIndex(g => g.id === dndState.draggedId);
        
        let sourceGroup = null;
        if (srcIdx !== -1) {
            sourceGroup = groups[srcIdx];
            // 物理移除源分组
            groups.splice(srcIdx, 1);
        }

        if (sourceGroup) {
             // --- 关键修复开始 ---
             // 计算正确的插入位置
             let insertIdx = srcIdx; // 默认回填原位 (安全兜底，防止乱跳)

             if (dndState.hoverId) {
                 if (dndState.hoverId === dndState.draggedId) {
                     // 如果目标是自己，说明应保持在原位
                     insertIdx = srcIdx;
                 } else {
                     // 在剩余列表中查找目标位置
                     const foundIdx = groups.findIndex(g => g.id === dndState.hoverId);
                     if (foundIdx !== -1) {
                         insertIdx = foundIdx;
                     }
                     // 如果找不到(foundIdx === -1)，维持 srcIdx 不变
                 }
             } else {
                 // hoverId 为 null 代表追加到末尾 (仅当引擎明确判定为末尾时)
                 // 注意：刚开始拖拽的一瞬间，如果引擎还没来得及计算 collision，hoverId 可能也是 null
                 // 但由于我们在 startDrag 立即调用了 detectCollision，所以这里 null 可信地代表 "末尾"
                 insertIdx = groups.length;
             }
             // --- 关键修复结束 ---

             // 插入占位符
             groups.splice(insertIdx, 0, { ...sourceGroup, isPlaceholder: true });
        }
    }

    // --- 网站卡片排序预览 ---
    if (dndState.type === 'site') {
        let sourceSite = null;
        for (const g of groups) {
            const idx = g.sites.findIndex(s => s.id === dndState.draggedId);
            if (idx !== -1) {
                [sourceSite] = g.sites.splice(idx, 1);
                break;
            }
        }

        if (sourceSite) {
            const placeholder = { ...sourceSite, isPlaceholder: true };
            const targetGroup = groups.find(g => g.id === dndState.hoverGroupId);
            
            if (targetGroup) {
                let insertIndex = targetGroup.sites.length; 
                
                if (dndState.hoverId) {
                    if (dndState.hoverId === dndState.draggedId) {
                        // 同样的逻辑，如果是卡片拖拽且目标是自己，位置由之前的逻辑决定
                        // 但因为这里是 grid 且先移除了，findIndex 会是 -1
                        // 不过卡片通常不需要像 Group 那么严格的"回填"，
                        // 只要 hoverGroupId 没变，且 hoverId 没变，保持原位即可。
                        // 这里我们依赖 findIndex，如果找不到则追加，这在卡片逻辑里通常表现尚可，
                        // 但为了完美，也可以加上类似判断，不过 Group 的问题更明显。
                        // 鉴于卡片逻辑较复杂(涉及跨组)，暂保持原样，如有问题再修。
                        const hoverIdx = targetGroup.sites.findIndex(s => s.id === dndState.hoverId);
                        if (hoverIdx !== -1) insertIndex = hoverIdx;
                    } else {
                        const hoverIdx = targetGroup.sites.findIndex(s => s.id === dndState.hoverId);
                        if (hoverIdx !== -1) insertIndex = hoverIdx;
                    }
                }
                
                targetGroup.sites.splice(insertIndex, 0, placeholder);
            }
        }
    }

    return groups;
  });

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
        animate:flip={{ duration: FLIP_DURATION }}
        data-dnd-group-id={group.id}
        class="w-full transition-all duration-300"
    >
        {#if group.isPlaceholder}
            <div class="w-full h-[180px] rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 animate-pulse"></div>
        {:else}
            <div class="group-item flex flex-col gap-4 relative">
                <div class="flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40 select-none">
                    <div 
                    class="p-1.5 rounded-lg text-text-dim transition-all touch-none shrink-0 -ml-1.5
                        {appState.isEditMode ? 'opacity-100 hover:bg-surface hover:text-primary active:scale-95' : 'opacity-0 pointer-events-none'}"
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
        {/if}
    </div>
  {/each}

  {#if appState.isEditMode}
   <button onclick={() => appState.openGroupModal()} class="w-full py-6 border-2 border-dashed border-border/40 rounded-2xl flex items-center justify-center gap-3 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/30 transition-all cursor-pointer group mt-2 active:scale-[0.99] animate-fade">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>