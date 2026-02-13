import { appState } from '../core/app.svelte';
import type { DndPayload } from '../types';

interface GroupMeta {
    id: string;
    rect: { top: number; bottom: number; left: number; right: number };
    grid: {
        cols: number;
        cellW: number;
        cellH: number;
        offsetX: number;
        offsetY: number;
    };
    itemCount: number;
}

class DndEngine {
    isDragging = $state(false);
    draggedId = $state<string | null>(null);
    type = $state<'group' | 'site' | null>(null);
    sourceGroupId = $state<string | null>(null);
    
    hoverGroupId = $state<string | null>(null);
    hoverIndex = $state<number | null>(null);
    hasDragged = false;

    sourceHeight = $state(0);

    #groupMetas: GroupMeta[] = [];
    
    #inputX = 0; #inputY = 0;
    #startX = 0; #startY = 0;
    #currentX = 0; #currentY = 0;
    #offsetX = 0; #offsetY = 0;
    
    #lastCollisionX = -1;
    #lastCollisionY = -1;
    
    #ghostEl: HTMLElement | null = null;
    #dragNode: HTMLElement | null = null;
    #pointerId: number | null = null;
    #rafId: number | null = null;
    #lastFrameTime = 0;

    readonly SCROLL_ZONE = 100;
    readonly SCROLL_SPEED_PER_SEC = 3000;
    readonly DRAG_THRESHOLD = 5;
    readonly VIRTUAL_EXPANSION = 100; 

    onDropCallback: ((payload: DndPayload) => void) | null = null;

    init(e: PointerEvent, type: 'group' | 'site', id: string, groupId: string | null, node: HTMLElement) {
        if (!appState.isEditMode || !e.isPrimary || e.button !== 0 || e.pointerType === 'touch') return;
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, select, [data-no-drag]')) return;

        this.type = type;
        this.#dragNode = node;
        this.#pointerId = e.pointerId;
        this.draggedId = id;
        this.sourceGroupId = groupId;
        this.hasDragged = false;
        
        this.#startX = e.clientX;
        this.#startY = e.clientY;
        this.#inputX = e.clientX;
        this.#inputY = e.clientY;
        
        this.#lastCollisionX = -1;
        this.#lastCollisionY = -1;

        let visualTarget = node;
        if (type === 'group') {
             const groupItem = node.closest('.group-item') as HTMLElement;
             if (groupItem) visualTarget = groupItem;
        }
        
        const rect = visualTarget.getBoundingClientRect();
        this.#offsetX = e.clientX - rect.left; 
        this.#offsetY = e.clientY - rect.top;
        
        this.sourceHeight = rect.height;

        window.addEventListener('pointermove', this.#onInput, { passive: true });
        window.addEventListener('pointerup', this.#onUp);
        window.addEventListener('pointercancel', this.#onUp);
        window.addEventListener('resize', this.#onResize);
    }

    #onInput = (e: PointerEvent) => {
        if (e.pointerId !== this.#pointerId) return;
        this.#inputX = e.clientX;
        this.#inputY = e.clientY;

        if (!this.isDragging) {
            const dx = this.#inputX - this.#startX;
            const dy = this.#inputY - this.#startY;
            if (dx * dx + dy * dy > this.DRAG_THRESHOLD * this.DRAG_THRESHOLD) {
                this.#startEngine();
            }
        }
    }

    #startEngine() {
        if (!this.#dragNode || !this.#pointerId) return;
        this.isDragging = true;
        this.hasDragged = true;
        document.body.classList.add('cursor-grabbing');

        let captureTarget = this.#dragNode;
        if (this.type === 'group') {
             const groupItem = this.#dragNode.closest('.group-item') as HTMLElement;
             if (groupItem) captureTarget = groupItem;
        }
        try { captureTarget.setPointerCapture(this.#pointerId); } catch {}

        this.#captureSnapshots();
        this.#createGhost(this.#dragNode);
        
        this.#lastFrameTime = performance.now();
        this.#loop();
    }

    #loop = () => {
        if (!this.isDragging) return;

        const now = performance.now();
        const dt = (now - this.#lastFrameTime) / 1000;
        this.#lastFrameTime = now;
        const safeDt = Math.min(dt, 0.1);

        this.#currentX = this.#inputX;
        this.#currentY = this.#inputY;

        const scrollDelta = this.#calculateScrollDelta(safeDt);
        if (scrollDelta !== 0) window.scrollBy(0, scrollDelta);

        const ghostW = this.#ghostEl ? parseFloat(this.#ghostEl.style.width) : 0;
        const ghostH = this.#ghostEl ? parseFloat(this.#ghostEl.style.height) : 0;
        const maxLeft = window.innerWidth - ghostW;
        const maxTop = window.innerHeight - ghostH;

        let ghostLeft = this.#currentX - this.#offsetX;
        let ghostTop = this.#currentY - this.#offsetY;

        const constrainedLeft = Math.max(0, Math.min(ghostLeft, maxLeft));
        const constrainedTop = Math.max(0, Math.min(ghostTop, maxTop));

        if (constrainedLeft !== ghostLeft) {
            this.#offsetX = this.#currentX - constrainedLeft;
        }
        if (constrainedTop !== ghostTop) {
            this.#offsetY = this.#currentY - constrainedTop;
        }

        ghostLeft = constrainedLeft;
        ghostTop = constrainedTop;

        if (this.#ghostEl) {
            this.#ghostEl.style.transform = `translate3d(${ghostLeft}px, ${ghostTop}px, 0) scale(1.05)`;
        }

        const centerX = ghostLeft + (ghostW / 2) + window.scrollX;
        const centerY = ghostTop + (ghostH / 2) + window.scrollY;

        const dist = Math.abs(centerX - this.#lastCollisionX) + Math.abs(centerY - this.#lastCollisionY);
        
        if (dist > 1 || scrollDelta !== 0) {
            this.#updateCollision(centerX, centerY);
            this.#lastCollisionX = centerX;
            this.#lastCollisionY = centerY;
        }

        this.#rafId = requestAnimationFrame(this.#loop);
    }

    #calculateScrollDelta(dt: number): number {
        const viewportY = this.#currentY;
        const viewportH = window.innerHeight;
        
        if (viewportY < this.SCROLL_ZONE) {
            const intensity = (this.SCROLL_ZONE - viewportY) / this.SCROLL_ZONE;
            return -1 * this.SCROLL_SPEED_PER_SEC * dt * (intensity * intensity);
        } else if (viewportY > viewportH - this.SCROLL_ZONE) {
            const intensity = (viewportY - (viewportH - this.SCROLL_ZONE)) / this.SCROLL_ZONE;
            return 1 * this.SCROLL_SPEED_PER_SEC * dt * (intensity * intensity);
        }
        return 0;
    }

    #updateCollision(centerX: number, centerY: number) {
        if (this.type === 'group') {
            this.#resolveGroupCollision(centerY);
        } else {
            this.#resolveSiteCollision(centerX, centerY);
        }
    }

    #resolveGroupCollision(y: number) {
        const validMetas = this.#groupMetas.filter(g => g.id !== this.draggedId);
        
        let newIndex = validMetas.length;

        for (let i = 0; i < validMetas.length; i++) {
            const meta = validMetas[i];
            const metaCenterY = (meta.rect.top + meta.rect.bottom) / 2;
            
            if (y < metaCenterY) {
                newIndex = i;
                break;
            }
        }
        
        if (this.hoverGroupId !== null) this.hoverGroupId = null;
        if (this.hoverIndex !== newIndex) this.hoverIndex = newIndex;
    }

    #resolveSiteCollision(x: number, y: number) {
        let activeGroup: GroupMeta | null = null;
        let minGroupDist = Infinity;

        for (const meta of this.#groupMetas) {
            let top = meta.rect.top;
            let bottom = meta.rect.bottom;
            
            if (this.hoverGroupId === meta.id) {
                bottom += this.VIRTUAL_EXPANSION;
            }

            if (meta.itemCount === 0) {
                 bottom = Math.max(bottom, top + 100);
            }

            if (x >= meta.rect.left && x <= meta.rect.right && y >= top && y <= bottom) {
                activeGroup = meta;
                break;
            }

            const centerX = (meta.rect.left + meta.rect.right) / 2;
            const centerY = (top + bottom) / 2;
            const dist = (x - centerX) ** 2 + (y - centerY) ** 2;
            
            if (dist < minGroupDist) {
                minGroupDist = dist;
                activeGroup = meta;
            }
        }
        
        if (!activeGroup) return;

        if (this.hoverGroupId !== activeGroup.id) this.hoverGroupId = activeGroup.id;
        
        if (activeGroup.itemCount === 0) {
            this.hoverIndex = 0;
            return;
        }

        const grid = activeGroup.grid;
        const contentLeft = activeGroup.rect.left + grid.offsetX;
        const contentTop = activeGroup.rect.top + grid.offsetY;
        
        const relX = x - contentLeft;
        const relY = y - contentTop;

        let col = Math.floor(relX / grid.cellW);
        let row = Math.floor(relY / grid.cellH);

        col = this.#clamp(col, 0, grid.cols - 1);
        row = Math.max(0, row);

        let targetIndex = row * grid.cols + col;
        
        if (targetIndex > activeGroup.itemCount) {
             targetIndex = activeGroup.itemCount;
        }

        if (this.hoverIndex !== targetIndex) this.hoverIndex = targetIndex;
    }

    #captureSnapshots() {
        this.#groupMetas = [];
        const sX = window.scrollX;
        const sY = window.scrollY;

        const stdRect = this.#dragNode!.getBoundingClientRect();
        const stdW = stdRect.width;
        const stdH = stdRect.height;

        const groupEls = document.querySelectorAll('[data-dnd-group-id]');
        
        for (const el of groupEls) {
            const rect = el.getBoundingClientRect();
            const id = el.getAttribute('data-dnd-group-id')!;
            const gridEl = el.querySelector('.grid') as HTMLElement;
            
            let cols = 1;
            let cellW = stdW;
            let cellH = stdH;
            let offsetX = 0;
            let offsetY = 0;
            let gap = 0;
            
            let itemCount = 0;

            if (gridEl) {
                const gridRect = gridEl.getBoundingClientRect();
                const computed = getComputedStyle(gridEl);
                
                const gapVal = parseFloat(computed.gap || computed.columnGap);
                if (!isNaN(gapVal)) gap = gapVal;
                
                const rowGapVal = parseFloat(computed.rowGap || computed.gap);
                const rowGap = isNaN(rowGapVal) ? gap : rowGapVal;

                offsetX = (gridRect.left - rect.left) + parseFloat(computed.paddingLeft || '0');
                offsetY = (gridRect.top - rect.top) + parseFloat(computed.paddingTop || '0');
                const contentWidth = gridRect.width - parseFloat(computed.paddingLeft || '0') - parseFloat(computed.paddingRight || '0');

                cellW = stdW + gap;
                cellH = stdH + rowGap;

                cols = Math.floor((contentWidth + gap + 1) / cellW);
                if (cols < 1) cols = 1;

                const siteEls = gridEl.querySelectorAll('[data-dnd-site-id]');
                itemCount = siteEls.length;
                
                if (id === this.sourceGroupId && this.type === 'site') {
                    itemCount = Math.max(0, itemCount - 1);
                }
            }

            this.#groupMetas.push({
                id,
                rect: {
                    top: rect.top + sY,
                    bottom: rect.bottom + sY,
                    left: rect.left + sX,
                    right: rect.right + sX
                },
                grid: {
                    cols,
                    cellW,
                    cellH,
                    offsetX,
                    offsetY
                },
                itemCount
            });
        }
    }

    #onUp = () => {
        if (this.#rafId) {
            cancelAnimationFrame(this.#rafId);
            this.#rafId = null;
        }

        if (this.isDragging && this.onDropCallback && this.draggedId && this.type) {
            this.onDropCallback({
                type: this.type,
                srcId: this.draggedId,
                targetGroupId: this.hoverGroupId,
                targetIndex: this.hoverIndex ?? 0
            });
        }
        this.#reset();
    }
    
    #onResize = () => {
        if (this.isDragging) {
            this.#onUp();
        }
    }

    #reset() {
        this.isDragging = false;
        setTimeout(() => { this.hasDragged = false; }, 50);
        
        this.draggedId = null;
        this.type = null;
        this.sourceGroupId = null;
        this.hoverGroupId = null;
        this.hoverIndex = null;
        this.sourceHeight = 0;
        this.#dragNode = null;
        this.#pointerId = null;
        this.#groupMetas = [];
        this.#lastCollisionX = -1;
        this.#lastCollisionY = -1;

        if (this.#ghostEl) {
            this.#ghostEl.remove();
            this.#ghostEl = null;
        }
        document.body.classList.remove('cursor-grabbing');
        
        window.removeEventListener('pointermove', this.#onInput);
        window.removeEventListener('pointerup', this.#onUp);
        window.removeEventListener('pointercancel', this.#onUp);
        window.removeEventListener('resize', this.#onResize);
    }

    #createGhost(src: HTMLElement) {
        let target = src;
        if (this.type === 'group') {
             const groupItem = src.closest('.group-item') as HTMLElement;
             if (groupItem) target = groupItem;
        }

        const rect = target.getBoundingClientRect();
        this.#ghostEl = target.cloneNode(true) as HTMLElement;
        
        Object.assign(this.#ghostEl.style, {
            position: 'fixed', 
            top: '0px', 
            left: '0px',
            width: `${rect.width}px`, 
            height: `${rect.height}px`,
            zIndex: '10000', 
            pointerEvents: 'none',
            transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
            boxShadow: '0 20px 40px -5px rgb(0 0 0 / 0.3)',
            transition: 'none',
            opacity: '0.9',
            willChange: 'transform'
        });

        this.#ghostEl.classList.remove('animate-fade', 'cursor-grab', 'cursor-move');
        document.body.appendChild(this.#ghostEl);
    }
    
    #clamp(val: number, min: number, max: number) {
        return Math.min(Math.max(val, min), max);
    }
    
    setOnDrop(fn: (payload: DndPayload) => void) {
        this.onDropCallback = fn;
    }
}

export const dndState = new DndEngine();

export function draggable(node: HTMLElement, params: { type: 'group' | 'site', id: string, groupId: string | null }) {
    function onDown(e: PointerEvent) {
        dndState.init(e, params.type, params.id, params.groupId, node);
    }

    function onClick(e: MouseEvent) {
        if (dndState.hasDragged) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }
    
    function onContextMenu(e: Event) {
        if (appState.isEditMode) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    $effect(() => {
        if (appState.isEditMode) {
            node.style.cursor = params.type === 'group' ? 'grab' : 'move';
            node.style.userSelect = 'none';

            node.addEventListener('pointerdown', onDown);
            node.addEventListener('click', onClick, { capture: true });
            node.addEventListener('contextmenu', onContextMenu);
        } else {
            node.style.cursor = '';
            node.style.touchAction = '';
            node.style.userSelect = '';
            
            node.removeEventListener('pointerdown', onDown);
            node.removeEventListener('click', onClick, { capture: true });
            node.removeEventListener('contextmenu', onContextMenu);
        }
    });
    return { 
        destroy() { 
            node.removeEventListener('pointerdown', onDown); 
            node.removeEventListener('click', onClick, { capture: true });
            node.removeEventListener('contextmenu', onContextMenu);
        } 
    };
}