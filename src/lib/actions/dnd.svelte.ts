import { appState } from '../core/app.svelte';

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
            
            e.dataTransfer.setDragImage(node, x, y);
        }
        
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

        if (draggingItem.type === 'group' && params.type !== 'group') return;
        
        if (draggingItem.type === 'site' && params.type === 'group') return;

        if (draggingItem.id === params.id) return;

        checkHover(draggingItem);
    }

    node.addEventListener('dragover', onDragOver);

    return {
        update(newParams: any) { params = newParams; },
        destroy() { node.removeEventListener('dragover', onDragOver); }
    };
}