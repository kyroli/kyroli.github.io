import { appState } from '../core/app.svelte';

let source = $state<{ type: 'group' | 'site', id: string, groupId?: string } | null>(null);

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

export const dndState = {
    get isDragging() { return !!source; },
    get type() { return source?.type; },
    get sourceId() { return source?.id; }
};

export function draggable(node: HTMLElement, data: { type: 'group' | 'site', id: string, groupId?: string }) {
    
    function onDragStart(e: DragEvent) {
        if (!appState.isEditMode) {
            e.preventDefault();
            return;
        }
        
        e.stopPropagation(); 
        source = data;
        
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
        
        setTimeout(() => node.classList.add('opacity-30', 'grayscale'), 0);
        document.body.style.cursor = 'grabbing';
    }

    function onDragEnd() {
        source = null;
        node.classList.remove('opacity-30', 'grayscale');
        document.body.style.cursor = '';
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

export function droppable(node: HTMLElement, params: { 
    type: 'group' | 'site' | 'zone',
    id?: string, 
    groupId?: string,
    onHover: (source: any) => void 
}) {
    const checkHover = throttle(params.onHover, 120);

    function onDragOver(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (!source || !e.dataTransfer) return;
        
        e.dataTransfer.dropEffect = 'move';
        
        if (source.type === 'group' && params.type !== 'group') return;
        
        if (source.type === 'site' && params.type === 'group') return; 

        if (source.id === params.id && source.type === params.type) return;

        checkHover(source);
    }

    node.addEventListener('dragover', onDragOver);

    return {
        update(newParams: any) { params = newParams; },
        destroy() { node.removeEventListener('dragover', onDragOver); }
    };
}