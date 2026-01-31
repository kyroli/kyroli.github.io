import { appState } from '../core/app.svelte';

// ----------------------------------------------------------------------
// Zero-Dependency Native DnD Engine for Svelte 5
// 纯原生、零依赖、面向未来的拖拽引擎
// ----------------------------------------------------------------------

// 全局状态：当前正在拖拽的物体
// 使用 Svelte 5 符文实现深层响应
let draggingItem = $state<{ type: 'group' | 'site', id: string, groupId?: string } | null>(null);

// 导出状态供 UI 使用（例如高亮拖拽源）
export const dndState = {
    get isDragging() { return !!draggingItem; },
    get type() { return draggingItem?.type; },
    get id() { return draggingItem?.id; },
    get groupId() { return draggingItem?.groupId; }
};

// 节流函数：防止拖拽时频繁触发重排导致闪烁
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Action: 让元素变得“可拖拽” (Draggable)
export function draggable(node: HTMLElement, data: { type: 'group' | 'site', id: string, groupId?: string }) {
    
    function onDragStart(e: DragEvent) {
        if (!appState.isEditMode) {
            e.preventDefault();
            return;
        }
        
        e.stopPropagation(); 
        draggingItem = data;
        
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            // 技巧：设置透明拖拽图，视觉效果更好
            e.dataTransfer.setDragImage(node, 20, 20);
        }
        
        // 延迟添加样式，让拖拽的“影子”生成后再变透明
        requestAnimationFrame(() => {
            node.classList.add('opacity-30', 'grayscale', 'scale-95');
        });
    }

    function onDragEnd() {
        draggingItem = null;
        node.classList.remove('opacity-30', 'grayscale', 'scale-95');
    }

    node.addEventListener('dragstart', onDragStart);
    node.addEventListener('dragend', onDragEnd);

    return {
        update(newData: any) { data = newData; },
        destroy() {
            node.removeEventListener('dragstart', onDragStart);
            node.removeEventListener('dragend', onDragEnd);
        }
    };
}

// Action: 让元素变成“放置区” (DropTarget)
export function dropTarget(node: HTMLElement, params: { 
    type: 'group' | 'site' | 'zone', 
    id?: string, 
    groupId?: string,
    onHover: (source: any) => void 
}) {
    // 黄金时间 120ms：既跟手又不会抽搐
    const checkHover = throttle(params.onHover, 120);

    function onDragOver(e: DragEvent) {
        e.preventDefault(); // 允许放置
        e.stopPropagation();

        if (!draggingItem) return;

        // 规则 1: 分组只能换分组
        if (draggingItem.type === 'group' && params.type !== 'group') return;
        
        // 规则 2: 卡片不能换分组（除非是专门的 zone）
        if (draggingItem.type === 'site' && params.type === 'group') return;

        // 规则 3: 自己不能换自己
        if (draggingItem.id === params.id) return;

        checkHover(draggingItem);
    }

    node.addEventListener('dragover', onDragOver);

    return {
        update(newParams: any) { params = newParams; },
        destroy() { node.removeEventListener('dragover', onDragOver); }
    };
}