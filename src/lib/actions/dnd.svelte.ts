import { appState } from '../core/app.svelte';

class DndEngine {
    // 核心状态
    isDragging = $state(false);
    type = $state<'group' | 'site' | null>(null);
    
    // 源数据
    draggedId = $state<string | null>(null);
    sourceGroupId = $state<string | null>(null);
    
    // 交互投影（目标）
    hoverGroupId = $state<string | null>(null);
    hoverId = $state<string | null>(null); // null 代表追加到末尾
    
    // 内部状态
    #startX = 0;
    #startY = 0;
    #isDown = false;
    #ghostEl: HTMLElement | null = null;
    #dragNode: HTMLElement | null = null;
    #pointerId: number | null = null;
    
    // 配置
    readonly THRESHOLD = 5; // 移动超过 5px 才视为拖拽，防止误触点击

    constructor() {}

    // 初始化交互（绑定于 onpointerdown）
    init(e: PointerEvent, type: 'group' | 'site', id: string, groupId: string | null, node: HTMLElement) {
        if (!appState.isEditMode || !e.isPrimary || e.button !== 0) return;

        this.#isDown = true;
        this.#startX = e.clientX;
        this.#startY = e.clientY;
        this.#dragNode = node;
        this.#pointerId = e.pointerId;

        // 临时存储参数，等真正触发拖拽时使用
        this.type = type;
        this.draggedId = id;
        this.sourceGroupId = groupId;

        // 绑定全局监听
        window.addEventListener('pointermove', this.#onMove, { passive: false });
        window.addEventListener('pointerup', this.#onUp);
        window.addEventListener('pointercancel', this.#onUp);
    }

    #onMove = (e: PointerEvent) => {
        if (!this.#isDown) return;

        if (!this.isDragging) {
            // 阈值检测
            const dx = e.clientX - this.#startX;
            const dy = e.clientY - this.#startY;
            if (Math.hypot(dx, dy) > this.THRESHold) {
                this.#startDrag(e);
            }
        } else {
            // 拖拽中
            e.preventDefault(); // 阻止滚动
            this.#updateGhost(e);
            this.#detectCollision(e);
        }
    }

    #startDrag(e: PointerEvent) {
        if (!this.#dragNode) return;

        this.isDragging = true;
        
        // 捕获指针，确保后续事件（即使移出屏幕）都发给该元素
        try {
            this.#dragNode.setPointerCapture(e.pointerId);
        } catch (err) {
            // 忽略某些极端情况下的捕获失败
        }

        // 创建幽灵元素
        let visualSource = this.#dragNode;
        // 如果是分组手柄，我们需要克隆整个分组容器
        if (this.type === 'group') {
             visualSource = this.#dragNode.closest('.group-item') as HTMLElement || this.#dragNode;
        }
        this.#createGhost(visualSource, e.clientX, e.clientY);
    }

    #updateGhost(e: PointerEvent) {
        if (!this.#ghostEl) return;
        // 直接修改 DOM 避免重绘开销
        const x = e.clientX - this.#startX;
        const y = e.clientY - this.#startY;
        this.#ghostEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    #detectCollision(e: PointerEvent) {
        // 穿透幽灵层检测下方元素
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        
        // 查找最近的上下文
        const groupEl = elements.find(el => el.closest('[data-dnd-group-id]'))?.closest('[data-dnd-group-id]') as HTMLElement;
        const siteEl = elements.find(el => el.closest('[data-dnd-site-id]'))?.closest('[data-dnd-site-id]') as HTMLElement;

        if (this.type === 'site') {
            if (groupEl) {
                this.hoverGroupId = groupEl.dataset.dndGroupId!;

                if (siteEl) {
                    const targetId = siteEl.dataset.dndSiteId!;
                    if (targetId !== this.draggedId) {
                        this.hoverId = targetId;
                    }
                } else {
                    // 在分组内但不在卡片上，视为追加
                    this.hoverId = null; 
                }
            }
        } else if (this.type === 'group') {
             if (groupEl) {
                 const targetGid = groupEl.dataset.dndGroupId!;
                 if (targetGid !== this.draggedId) {
                     this.hoverId = targetGid; // 复用 hoverId 存储目标 Group ID
                 }
             }
        }
    }

    #onUp = (e: PointerEvent) => {
        if (this.isDragging) {
            // 触发回调
            if (this.onDropCallback) {
                this.onDropCallback({
                    type: this.type,
                    srcId: this.draggedId,
                    srcGroupId: this.sourceGroupId,
                    targetGroupId: this.hoverGroupId,
                    targetId: this.hoverId
                });
            }
            // 释放捕获
            if (this.#dragNode && this.#pointerId) {
                try {
                   this.#dragNode.releasePointerCapture(this.#pointerId);
                } catch(err) {}
            }
        }

        this.#reset();
    }

    #reset() {
        this.#isDown = false;
        this.isDragging = false;
        this.type = null;
        this.draggedId = null;
        this.sourceGroupId = null;
        this.hoverGroupId = null;
        this.hoverId = null;
        this.#dragNode = null;
        this.#pointerId = null;

        if (this.#ghostEl) {
            this.#ghostEl.remove();
            this.#ghostEl = null;
        }

        window.removeEventListener('pointermove', this.#onMove);
        window.removeEventListener('pointerup', this.#onUp);
        window.removeEventListener('pointercancel', this.#onUp);
    }

    #createGhost(src: HTMLElement, clientX: number, clientY: number) {
        const rect = src.getBoundingClientRect();
        this.#ghostEl = src.cloneNode(true) as HTMLElement;
        
        // 修正初始坐标，让幽灵元素完美重叠在原元素上
        // 然后通过 translate3d 移动
        // 这里我们设置 fixed 定位，top/left 为初始位置
        const style = this.#ghostEl.style;
        style.position = 'fixed';
        style.top = `${rect.top}px`;
        style.left = `${rect.left}px`;
        style.width = `${rect.width}px`;
        style.height = `${rect.height}px`;
        style.zIndex = '9999';
        style.pointerEvents = 'none'; // 关键：让事件穿透幽灵
        style.opacity = '0.9';
        style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.15)';
        style.transition = 'none';
        
        // 重置可能的变换
        style.transform = 'translate3d(0,0,0)';
        
        // 修正起始点，保证移动时的 delta 计算正确
        // 这里的逻辑是：ghost 的基准点是 rect.top/left
        // 鼠标按下时位置是 clientX/Y
        // 移动后的 transform = (currX - startX, currY - startY)
        // 视觉上非常稳
        
        this.#ghostEl.classList.remove('opacity-0', 'pointer-events-none');
        document.body.appendChild(this.#ghostEl);
    }

    // 外部注入的回调
    onDropCallback: Function | null = null;
    
    setOnDrop(fn: Function) {
        this.onDropCallback = fn;
    }
}

export const dndState = new DndEngine();

// Svelte Action
export function draggable(node: HTMLElement, params: { type: 'group' | 'site', id: string, groupId: string | null }) {
    
    function onDown(e: PointerEvent) {
        dndState.init(e, params.type, params.id, params.groupId, node);
    }

    $effect(() => {
        if (appState.isEditMode) {
            node.style.cursor = params.type === 'group' ? 'grab' : 'move';
            // 关键：在编辑模式下禁用默认触摸动作（如滚动），保证拖拽不被打断
            // 但因为我们有了阈值判定，用户如果在非拖拽区域（如背景）滑动依然可以滚动
            // 在卡片上滑动则视为拖拽意图
            node.style.touchAction = 'none'; 
            node.addEventListener('pointerdown', onDown);
        } else {
            node.style.cursor = '';
            node.style.touchAction = '';
            node.removeEventListener('pointerdown', onDown);
        }
    });

    return {
        update(newParams: any) { params = newParams; },
        destroy() { node.removeEventListener('pointerdown', onDown); }
    };
}