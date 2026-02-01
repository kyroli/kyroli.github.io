import { appState } from '../core/app.svelte';

// 快照数据结构：冻结拖拽开始时的布局状态
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
    
    // 布局快照系统 (核心防抖机制)
    // 缓存分组内卡片的静态位置：Map<GroupId, List<CardRect>>
    #siteSnapshots = new Map<string, RectSnapshot[]>();
    // 缓存分组列表本身的静态位置
    #groupSnapshots: RectSnapshot[] = [];
    
    // 自动滚动状态
    #scrollRafId: number | null = null;
    #scrollParent: HTMLElement | Window | null = null;
    
    // 物理参数配置
    readonly THRESHOLD = 5;  // 防抖阈值 (px)
    readonly SCROLL_ZONE = 60; // 滚动触发边缘区域 (px)
    readonly MAX_SCROLL_SPEED = 20; // 最大滚动速度

    // 回调
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
            // 使用 RAF 节流检测，提升性能
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

        // --- 核心：建立初始世界快照 ---
        // 拖拽开始时，世界是静止的。记录这一刻的所有位置。
        this.#buildSnapshots();

        let visualSource = this.#dragNode;
        if (this.type === 'group') {
             visualSource = this.#dragNode.closest('.group-item') as HTMLElement || this.#dragNode;
        }
        this.#createGhost(visualSource);
        
        // 初始检测一次
        this.#detectCollision(e.clientX, e.clientY);
    }

    // 构建快照：只在拖拽开始或进入新区域时调用
    #buildSnapshots() {
        this.#siteSnapshots.clear();
        this.#groupSnapshots = [];

        // 1. 如果是拖拽分组，建立分组列表快照
        if (this.type === 'group') {
            const groups = Array.from(document.querySelectorAll('[data-dnd-group-id]'));
            this.#groupSnapshots = groups.map(el => this.#getElementSnapshot(el as HTMLElement, 'data-dnd-group-id'));
        }
        
        // 2. 如果是拖拽卡片，建立当前源分组的快照
        if (this.type === 'site' && this.sourceGroupId) {
            this.#captureGroupSnapshot(this.sourceGroupId);
        }
    }

    // 懒加载捕获特定分组的快照
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

    // --- 碰撞检测 (基于快照 + 意图分区) ---
    #detectCollision(mouseX: number, mouseY: number) {
        // 1. 确定当前所在的宏观区域（分组）
        // 这里依然需要实时 DOM，因为我们需要知道鼠标现在飘到了哪个分组头上
        const elements = document.elementsFromPoint(mouseX, mouseY);
        const groupEl = elements.find(el => el.closest('[data-dnd-group-id]'))?.closest('[data-dnd-group-id]') as HTMLElement;

        if (this.type === 'site') {
            if (groupEl) {
                const currentGroupId = groupEl.dataset.dndGroupId!;
                this.hoverGroupId = currentGroupId;

                // 懒加载快照：如果是第一次进入这个分组，抓取它现在的静态布局
                this.#captureGroupSnapshot(currentGroupId);
                
                const candidates = this.#siteSnapshots.get(currentGroupId) || [];
                if (candidates.length === 0) {
                    this.hoverId = null;
                    return;
                }

                // 2. 几何最近邻查找
                let closest: RectSnapshot | null = null;
                let minDist = Infinity;

                for (const snap of candidates) {
                    if (snap.id === this.draggedId) continue; // 忽略自身
                    const dist = (mouseX - snap.centerX) ** 2 + (mouseY - snap.centerY) ** 2;
                    if (dist < minDist) {
                        minDist = dist;
                        closest = snap;
                    }
                }

                // 3. 意图判断 (Intent Zones)
                if (closest) {
                    // 如果鼠标在目标卡片中心点的右侧，则判定意图为“插入到后面”
                    const relX = mouseX - closest.rect.left;
                    const insertAfter = relX > (closest.rect.width / 2);

                    if (insertAfter) {
                        const idx = candidates.indexOf(closest);
                        if (idx !== -1 && idx < candidates.length - 1) {
                             const nextItem = candidates[idx + 1];
                             this.hoverId = nextItem.id === this.draggedId ? this.draggedId : nextItem.id;
                        } else {
                            this.hoverId = null; // 末尾
                        }
                    } else {
                        this.hoverId = closest.id;
                    }
                }
            }
        } 
        else if (this.type === 'group') {
             // 分组排序逻辑 (垂直列表)
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
                 // 垂直逻辑：鼠标在下半区 -> 插入到后
                 const insertAfter = mouseY > closest.centerY;
                 
                 if (insertAfter) {
                     const idx = candidates.indexOf(closest);
                     if (idx !== -1 && idx < candidates.length - 1) {
                         const nextItem = candidates[idx + 1];
                         this.hoverId = nextItem.id === this.draggedId ? this.draggedId : nextItem.id;
                     } else {
                         this.hoverId = null;
                     }
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
                // 滚动导致页面布局相对于视口发生偏移，必须清空快照强制重算
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