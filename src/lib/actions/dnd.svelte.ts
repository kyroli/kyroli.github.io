import { appState } from '../core/app.svelte';

let draggingItem = $state(null);

export const dndState = {
    get isDragging() { return !!draggingItem; },
    get type() { return draggingItem?.type; },
    get id() { return draggingItem?.id; },
    get groupId() { return draggingItem?.groupId; }
};

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

export function draggable(node, data) {
    
    $effect(() => {
        node.draggable = appState.isEditMode;
        node.style.cursor = appState.isEditMode ? (data.type === 'group' ? 'grab' : 'move') : '';
    });

    function onDragStart(e) {
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
            
            const originalTransition = node.style.transition;
            node.style.transition = 'none';
            
            if (data.type === 'group') {
                node.classList.add('bg-surface', '!opacity-100');
                node.classList.remove('bg-surface/30');
            }

            e.dataTransfer.setDragImage(node, x, y);

            if (data.type === 'group') {
                node.classList.remove('bg-surface', '!opacity-100');
                node.classList.add('bg-surface/30');
            }
            node.style.transition = originalTransition;
        }
        
        requestAnimationFrame(() => {
            node.classList.add(
                'opacity-30', 
                'grayscale',   
                'border-2', 
                'border-dashed', 
                'border-primary/50'
            );
            
            if (data.type === 'site') {
                 node.classList.add('bg-surface/50');
            }
        });
    }

    function onDragEnd() {
        draggingItem = null;
        node.classList.remove(
            'opacity-30', 
            'grayscale', 
            'border-2', 
            'border-dashed', 
            'border-primary/50', 
            'bg-surface/50'
        );
    }

    node.addEventListener('dragstart', onDragStart);
    node.addEventListener('dragend', onDragEnd);

    return {
        update(newData) { data = newData; },
        destroy() {
            node.removeEventListener('dragstart', onDragStart);
            node.removeEventListener('dragend', onDragEnd);
        }
    };
}

export function dropTarget(node, params) {
    const checkHover = throttle(params.onHover, 100);

    function onDragOver(e) {
        e.preventDefault(); 
        e.stopPropagation();

        if (!draggingItem) return;
        if (draggingItem.type === 'group' && params.type !== 'group') return;
        if (draggingItem.id === params.id) return;

        checkHover(draggingItem);
    }

    function onDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggingItem && params.onDrop) {
            params.onDrop(draggingItem);
        }
    }

    node.addEventListener('dragover', onDragOver);
    node.addEventListener('drop', onDrop);

    return {
        update(newParams) { params = newParams; },
        destroy() { 
            node.removeEventListener('dragover', onDragOver); 
            node.removeEventListener('drop', onDrop); 
        }
    };
}