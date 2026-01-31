import { appState } from '../core/app.svelte';

// ----------------------------------------------------------------------
// Zero-Dependency Native DnD Engine for Svelte 5 (Enhanced)
// ----------------------------------------------------------------------

let draggingItem = $state<{ type: 'group' | 'site', id: string, groupId?: string } | null>(null);

export const dndState = {
    get isDragging() { return !!draggingItem; },
    get type() { return draggingItem?.type; },
    get id() { return draggingItem?.id; },
    get groupId() { return draggingItem?.groupId; }
};

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
            
            const rect = node.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 此时元素还是原样（不透明），浏览器会截取这个状态作为拖拽图
            e.dataTransfer.setDragImage(node, x, y);
        }
        
        // 延时添加样式，只改变留在原地的元素，不影响鼠标上的拖拽图
        requestAnimationFrame(() => {
            // 设计：让原地变成一个“虚线占位符”，看着更漂亮
            node.classList.add(
                'opacity-100', // 保持不透明，因为我们要显示边框
                'grayscale',   //以此区分
                'border-2', 
                'border-dashed', 
                'border-primary/50', 
                'bg-surface/50',
                '[&>*]:opacity-20' // 让内部内容变淡，只突出边框
            );
        });
    }

    function onDragEnd() {
        draggingItem = null;
        node.classList.remove(
            'opacity-100', 
            'grayscale', 
            'border-2', 
            'border-dashed', 
            'border-primary/50', 
            'bg-surface/50',
            '[&>*]:opacity-20'
        );
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

export function dropTarget(node: HTMLElement, params: { 
    type: 'group' | 'site' | 'zone', 
    id?: string, 
    groupId?: string,
    onHover: (source: any) => void,
    onDrop?: (source: any) => void  // 新增：支持 Drop 回调
}) {
    const checkHover = throttle(params.onHover, 100);

    function onDragOver(e: DragEvent) {
        e.preventDefault(); 
        e.stopPropagation();

        if (!draggingItem) return;
        if (draggingItem.type === 'group' && params.type !== 'group') return;
        if (draggingItem.id === params.id) return;

        checkHover(draggingItem);
    }

    // 新增：处理松手时的逻辑
    function onDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggingItem && params.onDrop) {
            params.onDrop(draggingItem);
        }
    }

    node.addEventListener('dragover', onDragOver);
    node.addEventListener('drop', onDrop);

    return {
        update(newParams: any) { params = newParams; },
        destroy() { 
            node.removeEventListener('dragover', onDragOver); 
            node.removeEventListener('drop', onDrop); 
        }
    };
}