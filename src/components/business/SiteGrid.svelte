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

  const FLIP_DURATION = 300; // 稍微增加动画时间，让避让更清晰

  // 核心逻辑：根据拖拽状态计算视觉上的列表（包含占位符和避让逻辑）
  const visualGroups = $derived.by(() => {
    // 1. 深拷贝原始数据
    let groups = dataState.groups.map(g => ({ 
        ...g, 
        sites: [...g.sites],
        isPlaceholder: false,
        isActive: false // 标记是否是被拖拽的源元素
    }));

    if (!dndState.isDragging) return groups;

    // --- 分组排序预览 ---
    if (dndState.type === 'group') {
        const srcIdx = groups.findIndex(g => g.id === dndState.draggedId);
        
        // 1. 找到源并将其移除（模拟提起）
        let sourceGroup = null;
        if (srcIdx !== -1) {
            sourceGroup = groups[srcIdx];
            // 标记源位置为 active，UI层可以决定是否隐藏它
            // 但为了实现平滑避让，我们通常直接从数组中移除它，然后在鼠标位置插入一个“克隆”
            // 这里的策略是：从列表中物理移除源，然后在 Hover 位置插入占位符
            groups.splice(srcIdx, 1);
        }

        // 2. 在目标位置插入占位符
        if (dndState.hoverId && sourceGroup) {
             let insertIdx = groups.findIndex(g => g.id === dndState.hoverId);
             
             // 如果 hoverId 是自己（虽然移除后不应该搜到），或未找到，则放回原处或末尾
             if (insertIdx === -1) insertIdx = groups.length;

             // 插入一个视觉上的占位符（其实就是源数据，只是位置变了）
             // 这里的 isActive 可以用来给它加一个虚线边框样式，或者保持原样
             // 保持原样效果最好，看起来就是分组在移动
             groups.splice(insertIdx, 0, { ...sourceGroup, isActive: true });
        } else if (sourceGroup) {
            // 如果没有 hoverId（比如拖到空白处），放回原位防止消失
            groups.splice(srcIdx, 0, { ...sourceGroup, isActive: true });
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
            const placeholder = { ...sourceSite, isPlaceholder: true };
            const targetGroup = groups.find(g => g.id === dndState.hoverGroupId);
            
            if (targetGroup) {
                let insertIndex = targetGroup.sites.length; 
                
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
          // 分组排序这里，targetId 是我们插入位置的“后一个”元素的ID
          // 也就是 Insert Before 语义
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
        class={`group-item flex flex-col gap-4 transition-all duration-300 relative ${group.isActive && dndState.type === 'group' ? 'opacity-30 scale-[0.98]' : ''}`}
        animate:flip={{ duration: FLIP_DURATION }}
        data-dnd-group-id={group.id}
    >
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
  {/each}

  {#if appState.isEditMode}
   <button onclick={() => appState.openGroupModal()} class="w-full py-6 border-2 border-dashed border-border/40 rounded-2xl flex items-center justify-center gap-3 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/30 transition-all cursor-pointer group mt-2 active:scale-[0.99] animate-fade">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>