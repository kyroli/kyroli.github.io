<script lang="ts">
  import { UI_CONSTANTS } from '$lib/utils';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import { GripHorizontal, Pencil, Trash2, Plus } from 'lucide-svelte';
  import SiteCard from './SiteCard.svelte';
  import { dndzone, SOURCES, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
  
  const flipDurationMs = 200;

  // 1. 分组拖拽锁定状态
  let canDragGroup = $state(false);

  // 辅助：生成一个固定的加号按钮数据对象
  function getAddBtn(groupId: string) {
    return { 
      id: `__btn_${groupId}`, 
      isAddBtn: true, 
      name: '', 
      url: '', 
      icon: '' 
    };
  }

  // 2. 分组拖拽处理
  function handleGroupDnd(e: CustomEvent<DndEvent<any>>) {
    const { items: newItems, info } = e.detail;
    dataState.groups = newItems; // 分组可以直接更新
    
    if (info.source === SOURCES.POINTER && (info.trigger === TRIGGERS.DROPPED || info.trigger === TRIGGERS.DRAG_STOPPED)) {
      dataState.markDirty();
      canDragGroup = false; // 拖拽结束，立即上锁
    }
  }

  // 3. 网站卡片拖拽处理（核心修复逻辑）
  function handleSiteDnd(groupId: string, e: CustomEvent<DndEvent<any>>) {
    const { items: mixedItems, info } = e.detail;
    
    // 【关键逻辑：数据清洗】
    // 无论拖拽库把元素排成什么样，我们手动执行一次“归位”操作：
    // 1. 过滤掉所有的加号按钮（防止意外产生多个或位置错误）
    const realSites = mixedItems.filter((item: any) => !item.isAddBtn);
    
    // 2. 如果是编辑模式，强制在最后追加一个加号按钮
    // 这样对于 dndzone 来说，items 列表永远是 [Site, Site, ..., Button]
    // 这种“欺骗”会让库以为按钮一直在最后，从而实现固定效果
    const displayItems = appState.isEditMode 
        ? [...realSites, getAddBtn(groupId)]
        : realSites;

    // 3. 更新视图
    // 注意：我们必须更新 group.sites 为包含按钮的列表，否则 dndzone 会因为 DOM 和数据不匹配而抖动
    // 但在保存数据时，我们会过滤掉这个按钮
    const groupIndex = dataState.groups.findIndex(g => g.id === groupId);
    if (groupIndex > -1) {
        dataState.groups[groupIndex].sites = displayItems;
    }

    // 4. 只有在真正“放下”时，才标记数据脏状态
    if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED) {
        // 保存时，我们需要把内存里的“加号按钮”清理干净，只保留纯净数据
        // 注意：这里不需要手动清理 group.sites，因为 manager 保存或 sync 同步时
        // 应该基于 realSites (如果不放心，可以在这里再做一次清理并回写，但通常只需标记脏状态)
        
        // 为了安全起见，我们把纯净数据写回去一次，防止加号按钮被误保存进 LocalStorage
        // 但为了 UI 不抖动，这一步要非常小心。
        // 更好的策略是：dataState.groups 在内存里可以包含按钮（UI层），
        // 但在 persistence 层（storage.ts）序列化时过滤。
        // 鉴于目前架构，我们保持 items 含按钮，但在 sync.push 时过滤（或者依赖后端清洗）。
        
        // 补丁：实际上 dataState.groups 是全局状态，直接含按钮会污染数据。
        // 所以我们采取“分离策略”：
        // 这里的 dataState.groups[index].sites 只是为了驱动 UI。
        // 真正的“保存动作”发生时（sync.push），我们需要确保不含按钮。
        // (注：下方的 handleFinalize 会负责最终清洗)
        dataState.markDirty();
    }
  }
  
  // 辅助：当拖拽结束时，确保数据源里没有脏数据（按钮）
  function handleSiteFinalize(groupId: string, e: CustomEvent<DndEvent<any>>) {
      const { items: mixedItems } = e.detail;
      const realSites = mixedItems.filter((item: any) => !item.isAddBtn);
      
      const groupIndex = dataState.groups.findIndex(g => g.id === groupId);
      if (groupIndex > -1) {
          // 最终落地：只保存真实数据！
          // 这样 dataState 里的数据永远是干净的
          dataState.groups[groupIndex].sites = realSites;
          dataState.markDirty();
      }
  }

</script>

<svelte:window onmouseup={() => canDragGroup = false} />

<div 
  class="w-full flex flex-col gap-6 pt-6 pb-20"
  use:dndzone={{
    items: dataState.groups, 
    flipDurationMs,
    // 分组拖拽开关：仅当手柄被按下时有效
    dragDisabled: !appState.isEditMode || !canDragGroup, 
    type: 'group',
    dropTargetStyle: { outline: 'none', border: 'none' }
  }}
  onconsider={handleGroupDnd}
  onfinalize={handleGroupDnd}
>
  
  {#each dataState.groups as group (group.id)}
    {@const displaySites = appState.isEditMode 
        ? [...group.sites.filter((s: any) => !s.isAddBtn), getAddBtn(group.id)] 
        : group.sites
    }

    <div 
        class="group-item flex flex-col bg-surface/30 rounded-2xl border border-transparent transition-colors duration-200 pb-2
               {appState.isEditMode ? 'border-border/40 hover:border-primary/20' : ''}"
    >
      <div class="flex items-center px-4 py-3 border-b border-border/40 min-h-[50px]">
        {#if appState.isEditMode}
           <div 
             class="cursor-grab active:cursor-grabbing p-2 mr-3 rounded-lg hover:bg-surface text-text-dim hover:text-primary transition-colors touch-none"
             onmousedown={() => canDragGroup = true}
             ontouchstart={() => canDragGroup = true}
             role="button"
             tabindex="0"
           >
             <GripHorizontal class="w-4 h-4" />
          </div>
        {/if}
        
        <div class="flex-1 flex items-center min-w-0 justify-between">
            <h2 class="font-bold text-xs tracking-[0.15em] text-text-dim/80 select-none truncate uppercase">{group.name}</h2>
            {#if appState.isEditMode}
               <div class="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
                 <button onclick={() => appState.openGroupModal(group.id)} class="text-text hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors" title={MESSAGES.UI.TIP_RENAME_GROUP}>
                   <Pencil class="w-3.5 h-3.5" />
                </button>
                 <button onclick={() => handleDeleteGroup(group.name, group.id)} class="text-text hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors" title={MESSAGES.UI.TIP_DELETE_GROUP}>
                   <Trash2 class="w-3.5 h-3.5" />
                 </button>
               </div>
            {/if}
        </div>
      </div>

      <div 
        class="{UI_CONSTANTS.GRID_LAYOUT} p-4 min-h-[20px]"
        use:dndzone={{
            items: displaySites, // 传入包含按钮的列表
            flipDurationMs,
            dragDisabled: !appState.isEditMode,
            type: 'site',
            dropTargetStyle: {} // 移除虚线
        }}
        onconsider={(e) => handleSiteDnd(group.id, e)}
        onfinalize={(e) => handleSiteFinalize(group.id, e)}
      >
          {#each displaySites as item (item.id)}
            {#if (item as any).isAddBtn}
                <div 
                    role="button" 
                    tabindex="0"
                    class="h-full min-h-[72px]" 
                    data-id={item.id}
                    onmousedown={(e) => e.stopPropagation()} 
                    ontouchstart={(e) => e.stopPropagation()}
                    style="order: 9999;" 
                >
                    <button 
                        onclick={() => appState.openSiteModal(group.id)} 
                        class="w-full h-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/40 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer active:scale-[0.98] group"
                        title={MESSAGES.UI.NEW_SITE}
                    >
                        <div class="w-8 h-8 rounded-full bg-surface border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-primary/30 group-hover:text-primary">
                            <Plus class="w-4 h-4" />
                        </div>
                        <span class="text-[10px] font-bold tracking-wider uppercase">{MESSAGES.UI.NEW_SITE}</span>
                    </button>
                </div>
            {:else}
                <div role="listitem" data-id={item.id}>
                    <SiteCard site={item} groupId={group.id} />
                </div>
            {/if}
          {/each}
      </div>

    </div>
  {/each}

  {#if appState.isEditMode}
   <button onclick={() => appState.openGroupModal()} class="w-full py-6 border-2 border-dashed border-border/40 rounded-2xl flex items-center justify-center gap-3 text-text-dim/50 hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer group active:scale-[0.99] animate-fade my-4">
      <Plus class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span class="font-bold text-sm tracking-widest">{MESSAGES.UI.NEW_GROUP}</span>
    </button>
  {/if}
</div>