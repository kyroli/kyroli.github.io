import { appState } from '../core/app.svelte';

// ----------------------------------------------------------------------
// Zero-Dependency Native DnD Engine for Svelte 5
// 纯原生、零依赖、面向未来的拖拽引擎
// ----------------------------------------------------------------------

// 全局状态：当前正在拖拽的物体
let draggingItem = $state<{ type: 'group' | 'site', id: string, groupId?: string } | null>(null);

// 导出状态供 UI 使用
export const dndState = {
    get isDragging() { return !!draggingItem; },
    get type() { return draggingItem?.type; },
    get id() { return draggingItem?.id; },
    get groupId() { return draggingItem?.groupId; }
};

// 节流函数
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
    
    $effect(() => {
        node.draggable = appState.isEditMode;
        node.style.cursor = appState.isEditMode ? (data.type === 'group' ? 'grab' : 'move') : '';
    });

    function onDragStart(e: DragEvent) {
        if (!appState.isEditMode) {
            e.preventDefault();
            return;
        }
        
        e.stopPropagation(); 
        draggingItem = data;
        
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            
            // 计算鼠标偏移量，防止跳变
            const rect = node.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            e.dataTransfer.setDragImage(node, x, y);
        }
        
        // 视觉优化：提高不透明度 (opacity-50)，不再那么透明了
        requestAnimationFrame(() => {
            node.classList.add('opacity-50', 'grayscale', 'scale-95');
        });
    }

    function onDragEnd() {
        draggingItem = null;
        node.classList.remove('opacity-50', 'grayscale', 'scale-95');
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
    const checkHover = throttle(params.onHover, 100);

    function onDragOver(e: DragEvent) {
        e.preventDefault(); 
        e.stopPropagation();

        if (!draggingItem) return;

        // 规则 1: 分组只能换分组 (防止把分组拖进卡片里)
        if (draggingItem.type === 'group' && params.type !== 'group') return;
        
        // 规则 2 (已删除): 允许卡片拖到分组背景上，这样就能跨组移动了！
        
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