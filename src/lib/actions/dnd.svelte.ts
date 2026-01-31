import { appState } from '../core/app.svelte';

class DndState {
    isDragging = $state(false);
    draggedItem = $state<any>(null);
    
    hoverGroupId = $state<string | null>(null);
    hoverId = $state<string | null>(null);
    
    constructor() {}

    start(item: any) {
        this.isDragging = true;
        this.draggedItem = item;
    }

    updateHover(groupId: string | null, itemId: string | null) {
        this.hoverGroupId = groupId;
        this.hoverId = itemId;
    }

    reset() {
        this.isDragging = false;
        this.draggedItem = null;
        this.hoverGroupId = null;
        this.hoverId = null;
    }

    get type() { return this.draggedItem?.type; }
    get id() { return this.draggedItem?.id; }
    get sourceGroupId() { return this.draggedItem?.groupId; }
}

export const dndState = new DndState();

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

export function draggable(node: HTMLElement, data: any) {
    
    $effect(() => {
        node.draggable = appState.isEditMode;
        node.style.cursor = appState.isEditMode ? (data.type === 'group' ? 'grab' : 'move') : '';
        node.style.userSelect = appState.isEditMode ? 'none' : '';
    });

    function onDragStart(e: DragEvent) {
        if (!appState.isEditMode) {
            e.preventDefault();
            return;
        }
        
        e.stopPropagation();
        dndState.start(data);
        
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            
            const rect = node.getBoundingClientRect();
            
            const clone = node.cloneNode(true) as HTMLElement;
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '-9999px';
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.opacity = '1';
            clone.style.backgroundColor = 'var(--bg)'; 
            clone.style.zIndex = '9999';
            clone.style.pointerEvents = 'none';
            clone.classList.remove('opacity-30', 'opacity-20'); 
            clone.classList.add('shadow-xl', 'ring-2', 'ring-primary', 'rounded-xl'); 

            document.body.appendChild(clone);
            
            e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top);
            
            requestAnimationFrame(() => {
                document.body.removeChild(clone);
                node.classList.add('opacity-0');
            });
        }
    }

    function onDragEnd() {
        dndState.reset();
        node.classList.remove('opacity-0');
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

export function dropTarget(node: HTMLElement, params: any) {
    const checkHover = throttle(() => {
        if (!dndState.isDragging) return;
        
        if (dndState.type === 'site') {
            dndState.updateHover(params.groupId, params.id);
        } else if (dndState.type === 'group' && params.type === 'group') {
            dndState.updateHover(null, params.id);
        }
    }, 50);

    function onDragOver(e: DragEvent) {
        e.preventDefault(); 
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        checkHover();
    }

    function onDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (dndState.isDragging && params.onDrop) {
            params.onDrop(dndState.draggedItem, params.groupId, params.id);
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