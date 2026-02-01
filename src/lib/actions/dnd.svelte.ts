import { appState } from '../core/app.svelte';

// 快照数据结构
interface RectSnapshot {
    id: string;
    rect: DOMRect;
    centerX: number;
    centerY: number;
}

class DndEngine {
    // 核心状态
    isDragging = $state(false);
    type = $state<'group' | 'site' | null>(null);
    
    // 源数据
    draggedId = $state<string | null>(null);
    sourceGroupId = $state<string | null>(null);
    
    // 视觉样式状态
    draggedHeight = $state(0); 

    // 交互投影（目标）
    hoverGroupId = $state<string | null>(null);
    hoverId = $state<string | null>(null); 
    
    // 内部状态
    #startX = 0;
    #startY = 0;
    #isDown = false;
    #ghostEl: HTMLElement | null = null;
    #dragNode: HTMLElement | null = null;
    #pointerId: number | null = null;
    
    // 布局快照系统
    #siteSnapshots = new Map<string, RectSnapshot[]>();
    #groupSnapshots: RectSnapshot[] = [];
    
    // 自动滚动状态
    #scrollRafId: number | null = null;
    #scrollParent: HTMLElement | Window | null = null;
    
    // 物理参数配置
    readonly THRESHOLD = 5;  
    readonly SCROLL_ZONE = 60; 
    readonly MAX_SCROLL_SPEED = 20; 

    // 🟢 新增：死区配置 (45% - 55%)
    readonly HYSTERESIS_LOWER = 0.45;
    readonly HYSTERESIS_UPPER = 0.55;

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
            this.#handleAutoScroll(e.clientX, e.clientY);
            requestAnimationFrame(() => this.#detectCollision(e.clientX, e.clientY));
        }
    }

    #startDrag(e: PointerEvent) {
        if (!this.#dragNode) return;

        this.isDragging = true;
        try {
            this.#dragNode.setPointerCapture(e.pointerId);
        } catch (err) {}

        this.#scrollParent = this.#findScrollParent(this.#dragNode);

        this.#buildSnapshots();

        let visualSource = this.#dragNode;
        if (this.type === 'group') {
             visualSource = this.#dragNode.closest('.group-item') as HTMLElement || this.#dragNode;
        }
        
        const rect = visualSource.getBoundingClientRect();
        this.draggedHeight = rect.height;

        this.#createGhost(visualSource);
        
        this.#detectCollision(e.clientX, e.clientY);
    }

    #buildSnapshots() {
        this.#siteSnapshots.clear();
        this.#groupSnapshots = [];

        if (this.type === 'group') {
            const groups = Array.from(document.querySelectorAll('[data-dnd-group-id]'));
            this.#groupSnapshots = groups.map(el => this.#getElementSnapshot(el as HTMLElement, 'data-dnd-group-id'));
        }
        
        if (this.type === 'site' && this.sourceGroupId) {
            this.#captureGroupSnapshot(this.sourceGroupId);
        }
    }

    #captureGroupSnapshot(groupId: string) {
        if (this.#siteSnapshots.has(groupId)) return;

        const groupEl = document.querySelector(`[data-dnd-group-id="${groupId}"]`);
        if (!groupEl) return;

        const sites = Array.from(groupEl.querySelectorAll('[data-dnd-site-id]'));
        const snapshots = sites.map(el => this.#getElementSnapshot(el as HTMLElement, 'data-dnd-site-id'));
        this.#siteSnapshots.set(groupId, snapshots);
    }

    #getElementSnapshot(el: HTMLElement, idAttr: string): RectSnapshot {
        const rect = el.getBoundingClientRect();
        return {
            id: el.getAttribute(idAttr)!,
            rect,
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2
        };
    }

    #detectCollision(mouseX: number, mouseY: number) {
        const elements = document.elementsFromPoint(mouseX, mouseY);
        const groupEl = elements.find(el => el.closest('[data-dnd-group-id]'))?.closest('[data-dnd-group-id]') as HTMLElement;

        if (this.type === 'site') {
            if (groupEl) {
                const currentGroupId = groupEl.dataset.dndGroupId!;
                this.hoverGroupId = currentGroupId;
                this.#captureGroupSnapshot(currentGroupId);
                
                const candidates = this.#siteSnapshots.get(currentGroupId) || [];
                if (candidates.length === 0) {
                    this.hoverId = null;
                    return;
                }

                let closest: RectSnapshot | null = null;
                let minDist = Infinity;

                for (const snap of candidates) {
                    if (snap.id === this.draggedId) continue; 
                    const dist = (mouseX - snap.centerX) ** 2 + (mouseY - snap.centerY) ** 2;
                    if (dist < minDist) {
                        minDist = dist;
                        closest = snap;
                    }
                }

                if (closest) {
                    // 计算潜在的“插入后”目标 ID
                    let afterTargetId: string | null = null;
                    const idx = candidates.indexOf(closest);
                    if (idx !== -1 && idx < candidates.length - 1) {
                        const nextItem = candidates[idx + 1];
                        // 如果下一个是拖拽源本身，那真正的下一个依然是它自己（逻辑位置）
                        afterTargetId = nextItem.id === this.draggedId ? this.draggedId : nextItem.id;
                    }
                    // else: afterTargetId = null (代表末尾)

                    // 🟢 核心修改：迟滞逻辑 (Hysteresis)
                    const relX = mouseX - closest.rect.left;
                    const ratio = relX / closest.rect.width; // 0.0 ~ 1.0

                    let insertAfter = false;

                    if (ratio > this.HYSTERESIS_UPPER) {
                        // 明确进入右侧 -> 插入到后
                        insertAfter = true;
                    } else if (ratio < this.HYSTERESIS_LOWER) {
                        // 明确进入左侧 -> 插入到前
                        insertAfter = false;
                    } else {
                        // 处于 45%~55% 冷静区：维持当前状态
                        // 如果当前 hoverId 等于“插入后”的目标 ID，则认为当前状态是“后”，保持它
                        insertAfter = (this.hoverId === afterTargetId);
                    }

                    if (insertAfter) {
                        this.hoverId = afterTargetId;
                    } else {
                        this.hoverId = closest.id;
                    }
                }
            }
        } 
        else if (this.type === 'group') {
             const candidates = this.#groupSnapshots;
             let closest: RectSnapshot | null = null;
             let minDist = Infinity;

             for (const snap of candidates) {
                 if (snap.id === this.draggedId) continue;
                 const dist = Math.abs(mouseY - snap.centerY);
                 if (dist < minDist) {
                     minDist = dist;
                     closest = snap;
                 }
             }

             if (closest) {
                 // 计算潜在的“插入后”目标
                 let afterTargetId: string | null = null;
                 const idx = candidates.indexOf(closest);
                 if (idx !== -1 && idx < candidates.length - 1) {
                     const nextItem = candidates[idx + 1];
                     afterTargetId = nextItem.id === this.draggedId ? this.draggedId : nextItem.id;
                 }

                 // 🟢 核心修改：垂直方向的迟滞逻辑
                 const relY = mouseY - closest.rect.top;
                 const ratio = relY / closest.rect.height;

                 let insertAfter = false;

                 if (ratio > this.HYSTERESIS_UPPER) {
                     insertAfter = true;
                 } else if (ratio < this.HYSTERESIS_LOWER) {
                     insertAfter = false;
                 } else {
                     // 冷静区：维持原判
                     insertAfter = (this.hoverId === afterTargetId);
                 }
                 
                 if (insertAfter) {
                     this.hoverId = afterTargetId;
                 } else {
                     this.hoverId = closest.id;
                 }
             }
        }
    }

    #findScrollParent(node: HTMLElement): HTMLElement | Window {
        let parent = node.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            if (/(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight) {
                return parent;
            }
            parent = parent.parentElement;
        }
        return window;
    }

    #handleAutoScroll(pointerX: number, pointerY: number) {
        if (this.#scrollRafId) {
            cancelAnimationFrame(this.#scrollRafId);
            this.#scrollRafId = null;
        }

        if (!this.#scrollParent) return;

        let rect: { top: number, bottom: number };
        let isWindow = false;

        if (this.#scrollParent instanceof Window) {
            isWindow = true;
            rect = { top: 0, bottom: window.innerHeight };
        } else {
            const el = this.#scrollParent as HTMLElement;
            const r = el.getBoundingClientRect();
            rect = { top: r.top, bottom: r.bottom };
        }

        let speedY = 0;
        if (pointerY < rect.top + this.SCROLL_ZONE) {
            const intensity = 1 - (Math.max(0, pointerY - rect.top) / this.SCROLL_ZONE);
            speedY = -this.MAX_SCROLL_SPEED * (intensity ** 2);
        } else if (pointerY > rect.bottom - this.SCROLL_ZONE) {
            const intensity = 1 - (Math.max(0, rect.bottom - pointerY) / this.SCROLL_ZONE);
            speedY = this.MAX_SCROLL_SPEED * (intensity ** 2);
        }

        if (Math.abs(speedY) > 0.5) {
            this.#scrollRafId = requestAnimationFrame(() => {
                if (isWindow) {
                    window.scrollBy(0, speedY);
                } else {
                    (this.#scrollParent as HTMLElement).scrollTop += speedY;
                }
                this.#rebuildSnapshotsOnScroll(); 
                this.#handleAutoScroll(pointerX, pointerY);
                this.#detectCollision(pointerX, pointerY);
            });
        }
    }
    
    #rebuildSnapshotsOnScroll() {
        if (this.hoverGroupId) {
            this.#siteSnapshots.delete(this.hoverGroupId);
        }
        this.#groupSnapshots = [];
        if (this.type === 'group') this.#buildSnapshots();
    }

    #updateGhost(e: PointerEvent) {
        if (!this.#ghostEl) return;
        const x = e.clientX - this.#startX;
        const y = e.clientY - this.#startY;
        this.#ghostEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    #onUp = (e: PointerEvent) => {
        if (this.#scrollRafId) {
            cancelAnimationFrame(this.#scrollRafId);
            this.#scrollRafId = null;
        }

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
                try { this.#dragNode.releasePointerCapture(this.#pointerId); } catch(err) {}
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
        this.#scrollParent = null;
        this.draggedHeight = 0; 
        
        this.#siteSnapshots.clear();
        this.#groupSnapshots = [];

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
        style.pointerEvents = 'none'; 
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