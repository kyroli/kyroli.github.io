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
    readonly THRESHOLD = 5; 

    // 外部注入的回调
    onDropCallback: ((payload: any) => void) | null = null;

    constructor() {}

    init(e: PointerEvent, type: 'group' | 'site', id: string, groupId: string | null, node: HTMLElement) {
        if (!appState.isEditMode || !e.isPrimary || e.button !== 0) return;

        this.#isDown = true;
        this.#startX = e.clientX;
        this.#startY = e.clientY;
        this.#dragNode = node;
        this.#pointerId = e.pointerId;

        this.type = type;
        this.draggedId = id;
        this.sourceGroupId = groupId;

        window.addEventListener('pointermove', this.#onMove, { passive: false });
        window.addEventListener('pointerup', this.#onUp);
        window.addEventListener('pointercancel', this.#onUp);
    }

    #onMove = (e: PointerEvent) => {
        if (!this.#isDown) return;

        if (!this.isDragging) {
            const dx = e.clientX - this.#startX;
            const dy = e.clientY - this.#startY;
            if (Math.hypot(dx, dy) > this.THRESHOLD) {
                this.#startDrag(e);
            }
        } else {
            e.preventDefault();
            this.#updateGhost(e);
            // 使用 requestAnimationFrame 节流检测，提升性能
            requestAnimationFrame(() => this.#detectCollision(e));
        }
    }

    #startDrag(e: PointerEvent) {
        if (!this.#dragNode) return;

        this.isDragging = true;
        try {
            this.#dragNode.setPointerCapture(e.pointerId);
        } catch (err) {}

        let visualSource = this.#dragNode;
        if (this.type === 'group') {
             visualSource = this.#dragNode.closest('.group-item') as HTMLElement || this.#dragNode;
        }
        this.#createGhost(visualSource);
    }

    #updateGhost(e: PointerEvent) {
        if (!this.#ghostEl) return;
        const x = e.clientX - this.#startX;
        const y = e.clientY - this.#startY;
        this.#ghostEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    #detectCollision(e: PointerEvent) {
        // 1. 基础命中测试（找到大容器）
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        
        // 2. 查找最近的分组容器
        const groupEl = elements.find(el => el.closest('[data-dnd-group-id]'))?.closest('[data-dnd-group-id]') as HTMLElement;

        if (this.type === 'site') {
            if (groupEl) {
                this.hoverGroupId = groupEl.dataset.dndGroupId!;
                
                // --- 核心修复：最近邻吸附算法 ---
                // 不再依赖 elementsFromPoint 找具体的卡片，而是遍历该组内所有卡片找最近的一个
                // 这完美解决了“卡片间隙（Gap）”导致的识别丢失和抽搐问题
                
                const candidates = Array.from(groupEl.querySelectorAll('[data-dnd-site-id]'));
                if (candidates.length === 0) {
                    this.hoverId = null; // 空组，直接追加
                    return;
                }

                let closest: { id: string, dist: number, el: Element } | null = null;
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                // 寻找距离鼠标中心最近的卡片
                for (const el of candidates) {
                    const rect = el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const dist = (mouseX - centerX) ** 2 + (mouseY - centerY) ** 2;
                    
                    if (!closest || dist < closest.dist) {
                        closest = { id: (el as HTMLElement).dataset.dndSiteId!, dist, el };
                    }
                }

                if (closest) {
                    // 判断插入逻辑：是插在前面还是后面？
                    // 简单的几何判断：如果鼠标在卡片中心点的右侧/下方，则认为是“Next”
                    const rect = closest.el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    
                    // 网格布局主要看 X 轴，如果鼠标超过中心点，则目标应该是下一个元素
                    // 但为了稳定性，我们采用“Insert Before”语义
                    // 如果鼠标在中心点右侧，我们应该 Insert Before Next Sibling
                    // 但这会增加计算复杂度。
                    // 简化策略：直接以最近元素的 ID 作为 Target（即插在它前面）。
                    // 用户的视觉感受会是：光标靠近谁，谁就让位。
                    
                    if (closest.id !== this.draggedId) {
                         this.hoverId = closest.id;
                    }
                }
            }
        } else if (this.type === 'group') {
             // 分组排序逻辑升级：也支持最近邻，防止分组间隙无法识别
             // 搜索整个文档中的分组
             const allGroups = Array.from(document.querySelectorAll('[data-dnd-group-id]'));
             
             let closestGroup: { id: string, dist: number } | null = null;
             const mouseY = e.clientY; // 分组主要是垂直排序，只看 Y 轴

             for (const el of allGroups) {
                 const rect = el.getBoundingClientRect();
                 const centerY = rect.top + rect.height / 2;
                 const dist = Math.abs(mouseY - centerY);

                 if (!closestGroup || dist < closestGroup.dist) {
                     closestGroup = { id: (el as HTMLElement).dataset.dndGroupId!, dist };
                 }
             }

             if (closestGroup && closestGroup.id !== this.draggedId) {
                 this.hoverId = closestGroup.id;
             }
        }
    }

    #onUp = (e: PointerEvent) => {
        if (this.isDragging) {
            if (this.onDropCallback) {
                this.onDropCallback({
                    type: this.type,
                    srcId: this.draggedId,
                    srcGroupId: this.sourceGroupId,
                    targetGroupId: this.hoverGroupId,
                    targetId: this.hoverId
                });
            }
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

    #createGhost(src: HTMLElement) {
        const rect = src.getBoundingClientRect();
        this.#ghostEl = src.cloneNode(true) as HTMLElement;
        
        const style = this.#ghostEl.style;
        style.position = 'fixed';
        style.top = `${rect.top}px`;
        style.left = `${rect.left}px`;
        style.width = `${rect.width}px`;
        style.height = `${rect.height}px`;
        style.zIndex = '9999';
        style.pointerEvents = 'none'; // 关键
        style.opacity = '0.9';
        style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.15)';
        style.transition = 'none';
        style.transform = 'translate3d(0,0,0)';
        
        this.#ghostEl.classList.remove('opacity-0', 'pointer-events-none');
        document.body.appendChild(this.#ghostEl);
    }
    
    setOnDrop(fn: (payload: any) => void) {
        this.onDropCallback = fn;
    }
}

export const dndState = new DndEngine();

export function draggable(node: HTMLElement, params: { type: 'group' | 'site', id: string, groupId: string | null }) {
    function onDown(e: PointerEvent) {
        dndState.init(e, params.type, params.id, params.groupId, node);
    }
    $effect(() => {
        if (appState.isEditMode) {
            node.style.cursor = params.type === 'group' ? 'grab' : 'move';
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