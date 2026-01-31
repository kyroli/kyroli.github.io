import { appState } from '../core/app.svelte';

class DndState {
    // 内部状态，立即更新
    _internalDragging = false;
    
    // UI 状态，延迟更新（为了让浏览器有时间生成快照）
    isDragging = $state(false);
    
    draggedItem = $state<any>(null);
    hoverGroupId = $state<string | null>(null);
    hoverId = $state<string | null>(null);
    
    constructor() {}

    start(item: any) {
        this._internalDragging = true;
        this.draggedItem = item;
        
        // 关键修复：延迟通知 UI 隐藏元素，确保浏览器先完成 setDragImage 快照截取
        requestAnimationFrame(() => {
            if (this._internalDragging) {
                this.isDragging = true;
            }
        });
    }

    updateHover(groupId: string | null, itemId: string | null) {
        this.hoverGroupId = groupId;
        this.hoverId = itemId;
    }

    reset() {
        this._internalDragging = false;
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
            
            // 关键修复：如果是分组，我们要克隆的是整个分组容器，而不是当前的把手(node)
            let targetEl = node;
            if (data.type === 'group') {
                const groupContainer = node.closest('.group-item') as HTMLElement;
                if (groupContainer) targetEl = groupContainer;
            }

            const rect = targetEl.getBoundingClientRect();
            
            // 深度克隆目标元素
            const clone = targetEl.cloneNode(true) as HTMLElement;
            
            // 样式清洗与强制增强
            clone.style.position = 'absolute';
            // 必须先显式设置宽高，否则可能坍缩
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            // 放置在当前元素完全重合的位置，避免视觉跳动
            clone.style.top = `${rect.top + window.scrollY}px`;
            clone.style.left = `${rect.left + window.scrollX}px`;
            
            // 强制不透明，解决“提起来看不清”的问题
            clone.style.opacity = '1';
            clone.style.zIndex = '9999';
            clone.style.pointerEvents = 'none';
            // 强制背景色，防止原有的半透明背景导致重影
            clone.style.backgroundColor = 'var(--bg)'; 
            clone.style.borderRadius = '16px'; // 保持圆角
            
            // 移除可能导致透明度变化的类
            clone.classList.remove('opacity-0', 'transition-all', 'duration-300');
            // 添加阴影增强拖拽质感
            clone.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
            clone.style.border = '2px solid rgba(var(--primary) / 0.5)';

            document.body.appendChild(clone);
            
            // 计算鼠标相对于元素的偏移量
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            e.dataTransfer.setDragImage(clone, offsetX, offsetY);
            
            // 在下一帧移除克隆体，并手动设置原元素样式（双重保险）
            requestAnimationFrame(() => {
                document.body.removeChild(clone);
                // 这里不需要手动设置 opacity-0，因为 dndState.isDragging 变为 true 后
                // SiteGrid 会通过 isHidden 属性自动处理隐藏，且因为有延时，不会影响快照
            });
        }
    }

    function onDragEnd() {
        dndState.reset();
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
        // 只有当 isDragging (UI状态) 为 true 时才响应 hover，防止误触
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