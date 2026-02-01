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
    
    // 自动滚动状态
    #scrollRafId: number | null = null;
    #scrollParent: HTMLElement | Window | null = null;
    
    // 配置
    readonly THRESHOLD = 5; 
    readonly SCROLL_ZONE = 60; // 边缘触发滚动的感应区 (px)
    readonly MAX_SCROLL_SPEED = 20; // 最大滚动速度 (px/frame)

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
            
            // 每次移动更新滚动检测
            this.#handleAutoScroll(e.clientX, e.clientY);

            // 节流检测碰撞
            requestAnimationFrame(() => this.#detectCollision(e));
        }
    }

    #startDrag(e: PointerEvent) {
        if (!this.#dragNode) return;

        this.isDragging = true;
        try {
            this.#dragNode.setPointerCapture(e.pointerId);
        } catch (err) {}

        // 确定滚动的父容器
        this.#scrollParent = this.#findScrollParent(this.#dragNode);

        let visualSource = this.#dragNode;
        if (this.type === 'group') {
             visualSource = this.#dragNode.closest('.group-item') as HTMLElement || this.#dragNode;
        }
        this.#createGhost(visualSource);
    }

    // --- 智能碰撞检测 (Intent Zones) ---
    #detectCollision(e: PointerEvent) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const groupEl = elements.find(el => el.closest('[data-dnd-group-id]'))?.closest('[data-dnd-group-id]') as HTMLElement;

        if (this.type === 'site') {
            if (groupEl) {
                this.hoverGroupId = groupEl.dataset.dndGroupId!;
                
                // 获取当前分组下的所有卡片（按 DOM 顺序）
                const candidates = Array.from(groupEl.querySelectorAll('[data-dnd-site-id]'));
                if (candidates.length === 0) {
                    this.hoverId = null;
                    return;
                }

                // 1. 找到几何距离最近的卡片
                let closest: { id: string, el: Element, dist: number } | null = null;
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                for (const el of candidates) {
                    const rect = el.getBoundingClientRect();
                    // 计算到卡片中心点的距离
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const dist = (mouseX - centerX) ** 2 + (mouseY - centerY) ** 2;
                    
                    if (!closest || dist < closest.dist) {
                        closest = { id: (el as HTMLElement).dataset.dndSiteId!, el, dist };
                    }
                }

                // 2. 意图判断：插入前 vs 插入后
                if (closest) {
                    const rect = closest.el.getBoundingClientRect();
                    const isGrid = true; // 卡片默认是 Grid 布局
                    
                    let insertAfter = false;

                    if (isGrid) {
                        // Grid 逻辑：如果卡片在同一行，看左右；换行看上下
                        // 简化版：看中心点。如果在中心点右侧或下方，则意图是插到它后面
                        // 这里为了响应用户的 "上半区/下半区" 需求，我们结合 X 和 Y
                        
                        // 逻辑：如果指针在卡片中心点的右侧 (RTL) 或 下方
                        const relX = mouseX - rect.left;
                        const relY = mouseY - rect.top;
                        
                        // "插入到后" 的条件：
                        // 1. 鼠标在卡片右侧 (>50% width) 
                        // 2. 或者鼠标虽然在左侧，但是在下方 (>50% height) - 处理多行 Grid 的边缘情况
                        // 为了符合直觉，Grid 主要是水平流：
                        if (relX > rect.width / 2) {
                            insertAfter = true;
                        }
                    } 

                    // 3. 计算最终 Target ID
                    if (insertAfter) {
                        // 如果意图是插到 closest 后面，那么 hoverId 应该是 closest 的下一个兄弟
                        const currentIndex = candidates.findIndex(c => c === closest!.el);
                        if (currentIndex !== -1 && currentIndex < candidates.length - 1) {
                            // 有下一个兄弟，Target 设为下一个兄弟的 ID (Insert Before Next)
                            const nextEl = candidates[currentIndex + 1] as HTMLElement;
                            this.hoverId = nextEl.dataset.dndSiteId!;
                        } else {
                            // 没有下一个兄弟，说明是最后一个，Target 为 null (Append)
                            this.hoverId = null;
                        }
                    } else {
                        // 意图是插到 closest 前面
                        this.hoverId = closest.id;
                    }
                    
                    // 特殊修正：如果是拖拽自身
                    // 如果计算出的位置就是自己或者是自己的下一个位置，保持稳定
                    if (this.hoverId === this.draggedId) {
                         // 保持当前位置，不做变动，避免闪烁
                         // 但为了 UI 正确显示占位符，通常我们可以让 hoverId 指向自己
                    }
                }
            }
        } else if (this.type === 'group') {
             // 分组排序 (垂直列表)
             const allGroups = Array.from(document.querySelectorAll('[data-dnd-group-id]'));
             let closestGroup: { id: string, el: Element, dist: number } | null = null;
             const mouseY = e.clientY;

             for (const el of allGroups) {
                 const rect = el.getBoundingClientRect();
                 const centerY = rect.top + rect.height / 2;
                 const dist = Math.abs(mouseY - centerY);

                 if (!closestGroup || dist < closestGroup.dist) {
                     closestGroup = { id: (el as HTMLElement).dataset.dndGroupId!, el, dist };
                 }
             }

             if (closestGroup) {
                 const rect = closestGroup.el.getBoundingClientRect();
                 // 垂直列表逻辑：下半区 -> 插入到后
                 const insertAfter = mouseY > (rect.top + rect.height / 2);

                 if (insertAfter) {
                     const idx = allGroups.findIndex(g => g === closestGroup!.el);
                     if (idx !== -1 && idx < allGroups.length - 1) {
                         const nextEl = allGroups[idx + 1] as HTMLElement;
                         this.hoverId = nextEl.dataset.dndGroupId!;
                     } else {
                         this.hoverId = null;
                     }
                 } else {
                     this.hoverId = closestGroup.id;
                 }
             }
        }
    }

    // --- 自动滚动系统 ---
    #findScrollParent(node: HTMLElement): HTMLElement | Window {
        let parent = node.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            const overflowY = style.overflowY;
            // 检测可滚动的容器
            if (/(auto|scroll)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
                return parent;
            }
            parent = parent.parentElement;
        }
        return window;
    }

    #handleAutoScroll(pointerX: number, pointerY: number) {
        // 清除上一帧的滚动请求
        if (this.#scrollRafId) {
            cancelAnimationFrame(this.#scrollRafId);
            this.#scrollRafId = null;
        }

        if (!this.#scrollParent) return;

        let rect: { top: number, bottom: number, height: number };
        let isWindow = false;

        if (this.#scrollParent instanceof Window) {
            isWindow = true;
            rect = { 
                top: 0, 
                bottom: window.innerHeight, 
                height: window.innerHeight 
            };
        } else {
            const el = this.#scrollParent as HTMLElement;
            const r = el.getBoundingClientRect();
            rect = { top: r.top, bottom: r.bottom, height: r.height };
        }

        // 计算滚动速度
        let speedY = 0;
        
        // 顶部检测
        if (pointerY < rect.top + this.SCROLL_ZONE) {
            // 越靠近边缘越快：使用 (1 - dist/zone) 做插值
            const dist = Math.max(0, pointerY - rect.top);
            const intensity = 1 - (dist / this.SCROLL_ZONE); // 0..1
            // 指数曲线优化手感 (intensity ^ 2)
            speedY = -this.MAX_SCROLL_SPEED * (intensity * intensity);
        } 
        // 底部检测
        else if (pointerY > rect.bottom - this.SCROLL_ZONE) {
            const dist = Math.max(0, rect.bottom - pointerY);
            const intensity = 1 - (dist / this.SCROLL_ZONE);
            speedY = this.MAX_SCROLL_SPEED * (intensity * intensity);
        }

        if (Math.abs(speedY) > 0.5) {
            this.#scrollRafId = requestAnimationFrame(() => {
                if (isWindow) {
                    window.scrollBy(0, speedY);
                } else {
                    (this.#scrollParent as HTMLElement).scrollTop += speedY;
                }
                // 持续滚动：只要指针不动，就要继续触发
                // 我们通过更新 ghost 位置触发下一帧的 pointermove 是行不通的
                // 必须在 RAF 里递归调用检测，但由于 pointerY 没变，我们可以直接递归 scroll
                // 简化起见，这里只做单帧滚动，因为 pointermove 事件在移动时很密集
                // 如果鼠标静止在边缘，需要递归调用。
                this.#handleAutoScroll(pointerX, pointerY);
                
                // 滚动会导致元素位置变化，必须强制重新检测碰撞
                // 传入当前指针位置（相对于视口不变，但元素变了）
                // 构造一个伪造的 PointerEvent 来复用逻辑有点麻烦，直接调方法
                this.#detectCollision({ clientX: pointerX, clientY: pointerY } as PointerEvent);
            });
        }
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
        this.#scrollParent = null;

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