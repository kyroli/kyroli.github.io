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
    
    // 物理引擎内部状态
    #activeClosestId: string | null = null;
    #insertAfterState = false;
    #grabOffsetY = 0; // 质心投影偏移量

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
    
    // 死区配置
    readonly HYSTERESIS_PIXEL = 6; 
    readonly HYSTERESIS_RATIO_LOWER = 0.45;
    readonly HYSTERESIS_RATIO_UPPER = 0.55;

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

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        this.#grabOffsetY = e.clientY - centerY;

        this.#createGhost(visualSource);
        
        this.#detectCollision(e.clientX, e.clientY);
    }

    #buildSnapshots() {
        this.#siteSnapshots.clear();
        this.#groupSnapshots = [];

        const groups = Array.from(document.querySelectorAll('[data-dnd-group-id]'));
        this.#groupSnapshots = groups.map(el => this.#getElementSnapshot(el as HTMLElement, 'data-dnd-group-id'));
        
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
        if (this.type === 'site') {
            let targetGroupSnapshot: RectSnapshot | null = null;
            
            for (const snap of this.#groupSnapshots) {
                if (
                    mouseX >= snap.rect.left && 
                    mouseX <= snap.rect.right && 
                    mouseY >= snap.rect.top && 
                    mouseY <= snap.rect.bottom
                ) {
                    targetGroupSnapshot = snap;
                    break;
                }
            }

            if (targetGroupSnapshot) {
                const currentGroupId = targetGroupSnapshot.id;
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
                    const afterTargetId = this.#findNextDistinctId(candidates, closest);

                    const relX = mouseX - closest.rect.left;
                    const ratio = relX / closest.rect.width; 

                    this.#updateHysteresisState(closest.id, ratio, 'site');

                    if (this.#insertAfterState) {
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
                 const afterTargetId = this.#findNextDistinctId(candidates, closest);

                 const projectedCenterY = mouseY - this.#grabOffsetY;
                 const diff = projectedCenterY - closest.centerY;

                 this.#updateHysteresisState(closest.id, diff, 'group');
                 
                 if (this.#insertAfterState) {
                     this.hoverId = afterTargetId;
                 } else {
                     this.hoverId = closest.id;
                 }
             }
        }
    }

    #findNextDistinctId(candidates: RectSnapshot[], current: RectSnapshot): string | null {
        const idx = candidates.indexOf(current);
        let pointer = idx + 1;
        while (pointer < candidates.length) {
            const candidate = candidates[pointer];
            if (candidate.id !== this.draggedId) {
                return candidate.id;
            }
            pointer++;
        }
        return null;
    }

    #updateHysteresisState(targetId: string, value: number, type: 'group' | 'site') {
        if (targetId !== this.#activeClosestId) {
            this.#activeClosestId = targetId;
            
            if (type === 'group') {
                this.#insertAfterState = value > 0;
            } else {
                this.#insertAfterState = value > 0.5;
            }
            return;
        }

        if (type === 'group') {
            if (value > this.HYSTERESIS_PIXEL) {
                this.#insertAfterState = true;
            } else if (value < -this.HYSTERESIS_PIXEL) {
                this.#insertAfterState = false;
            }
        } else {
            if (value > this.HYSTERESIS_RATIO_UPPER) {
                this.#insertAfterState = true;
            } else if (value < this.HYSTERESIS_RATIO_LOWER) {
                this.#insertAfterState = false;
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
        this.#ghostEl.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.02)`;
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
        
        this.#activeClosestId = null;
        this.#insertAfterState = false;
        this.#grabOffsetY = 0;
        
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
        
        style.opacity = '1';
        style.transform = 'translate3d(0,0,0) scale(1.02)';
        style.boxShadow = '0 30px 60px -12px rgb(0 0 0 / 0.35)';
        // --------------------------------

        style.transition = 'none';
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