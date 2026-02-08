<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { dataState } from '$lib/core/data.svelte';

  // --- 物理参数 ---
  const RADIUS = 260;
  const ITEM_ANGLE = 14;
  const FRICTION = 0.94;     // 稍微增加一点摩擦，让停车更稳
  const SNAP_SPEED = 0.2;
  const SNAP_STRENGTH = 0.08;

  // --- 核心状态 ---
  let currentAngle = $state(0);
  let velocity = $state(0);
  let isWheeling = false;
  let rafId: number;

  // --- 虚拟列表计算 ---
  // 真实槽位总数 = 分组数 + 1个占位符
  const totalSlots = $derived(dataState.groups.length + 1);
  
  // 当前物理索引 (可能是 100, 101, 102...)
  const snappedVirtualIndex = $derived(Math.round(currentAngle / ITEM_ANGLE));
  
  // 映射到逻辑索引 (0 ~ totalSlots-1)
  // ((x % n) + n) % n 是为了处理负数索引的正确取模
  const normalizedIndex = $derived(((snappedVirtualIndex % totalSlots) + totalSlots) % totalSlots);
  
  // 判断当前是否停在占位符上
  const isOnSpacer = $derived(normalizedIndex === dataState.groups.length);

  // --- 物理引擎循环 ---
  function loop() {
    currentAngle += velocity;
    velocity *= FRICTION;

    const targetAngle = snappedVirtualIndex * ITEM_ANGLE;
    const distToTarget = targetAngle - currentAngle;

    if (Math.abs(velocity) < SNAP_SPEED || Math.abs(distToTarget) < 1) {
        velocity += distToTarget * SNAP_STRENGTH;
        if (Math.abs(distToTarget) < 0.01 && Math.abs(velocity) < 0.01) {
            currentAngle = targetAngle;
            velocity = 0;
        }
    }
    rafId = requestAnimationFrame(loop);
  }

  // --- 交互处理 ---
  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    isWheeling = true;
    velocity += e.deltaY * 0.04;
    
    // 停止操作 300ms 后释放锁定，允许页面反向同步
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => isWheeling = false, 300);
  }
  let wheelTimer: number;

  function handleClick(virtualIndex: number) {
    const targetAngle = virtualIndex * ITEM_ANGLE;
    velocity = (targetAngle - currentAngle) * 0.15;
    isWheeling = true;
  }

  // --- 同步逻辑 (双向) ---
  
  // 1. 滚轮 -> 页面
  $effect(() => {
    if (dataState.groups.length === 0) return;
    
    // 只有当滚轮稳定、且不在操作中、且不是占位符时，才驱动页面
    // 如果停在 Spacer 上，页面保持不动，这就是“防误触缓冲区”
    if (!isOnSpacer && Math.abs(velocity) < 0.5) {
        const targetId = dataState.groups[normalizedIndex].id;
        const el = document.querySelector(`[data-dnd-group-id="${targetId}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
    }
  });

  // 2. 页面 -> 滚轮 (当用户拖动浏览器滚动条时)
  // 我们需要找到离当前 currentAngle 最近的、对应的虚拟索引
  function syncFromPage() {
    if (isWheeling || dataState.groups.length === 0) return;

    const winHalf = window.innerHeight / 2;
    let closestGroupIndex = -1;
    let minDiff = Infinity;

    // 找到页面上当前正中间的分组
    dataState.groups.forEach((g, i) => {
        const el = document.querySelector(`[data-dnd-group-id="${g.id}"]`);
        if (el) {
            const rect = el.getBoundingClientRect();
            const diff = Math.abs((rect.top + rect.height/2) - winHalf);
            if (diff < minDiff) {
                minDiff = diff;
                closestGroupIndex = i;
            }
        }
    });

    if (closestGroupIndex !== -1) {
        // 关键算法：寻找最近的虚拟索引
        // 我们知道逻辑索引是 closestGroupIndex
        // 我们现在的虚拟位置对应逻辑索引是 normalizedIndex
        // 我们需要调整 currentAngle，使其平滑过渡到 closestGroupIndex 对应的最近一圈
        
        // 当前虚拟索引
        const currentV = Math.round(currentAngle / ITEM_ANGLE);
        // 当前逻辑索引
        const currentL = ((currentV % totalSlots) + totalSlots) % totalSlots;
        
        // 计算差值
        let diff = closestGroupIndex - currentL;
        
        // 优化路径：走最短的圈
        // 例如：从 0 到 10 (总数11)，应该是 -1 而不是 +10
        if (diff > totalSlots / 2) diff -= totalSlots;
        if (diff < -totalSlots / 2) diff += totalSlots;
        
        // 只有当偏差确实存在时才修正，避免死循环抖动
        if (Math.abs(diff) > 0) {
            // 直接修改目标角度，或者给一个吸附速度
            // 这里为了跟随手感，我们直接软修正角度
            const targetV = currentV + diff;
            const targetA = targetV * ITEM_ANGLE;
            
            // 这是一个平滑跟随算法，不是硬跳
            currentAngle += (targetA - currentAngle) * 0.1;
        }
    }
  }

  onMount(() => {
    rafId = requestAnimationFrame(loop);
    
    // 启动页面位置监听
    const timer = setInterval(syncFromPage, 100); // 低频同步即可
    
    return () => {
        cancelAnimationFrame(rafId);
        clearInterval(timer);
    };
  });
</script>

<aside 
    class="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden xl:block h-[420px] w-48 select-none pointer-events-auto bg-surface/5 backdrop-blur-[2px] border-r border-border/60 rounded-r-2xl shadow-[inset_-10px_0_20px_-10px_rgba(0,0,0,0.05)] cursor-grab active:cursor-grabbing"
    onwheel={handleWheel}
    style="perspective: 1500px;" 
>
    <div class="absolute inset-0 z-20 pointer-events-none rounded-r-2xl overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-bg via-bg/80 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg via-bg/80 to-transparent"></div>
        <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent mix-blend-overlay"></div>
    </div>

    <div class="relative w-full h-full z-10" style="transform-style: preserve-3d;">
        {#each Array.from({length: 21}, (_, i) => snappedVirtualIndex - 10 + i) as virtualIdx (virtualIdx)}
            {@const offsetAngle = (virtualIdx * ITEM_ANGLE) - currentAngle}
            
            {@const modIdx = ((virtualIdx % totalSlots) + totalSlots) % totalSlots}
            {@const isSpacerSlot = modIdx === dataState.groups.length}
            {@const group = !isSpacerSlot ? dataState.groups[modIdx] : null}

            {#if Math.abs(offsetAngle) < 60}
                {@const opacity = Math.pow(1 - (Math.abs(offsetAngle) / 60), 2)}
                {@const isActive = Math.abs(offsetAngle) < (ITEM_ANGLE / 1.5)}

                {#if isSpacerSlot}
                    <div 
                        class="absolute right-0 top-1/2 -mt-[20px] w-full h-[40px] flex items-center justify-end pr-8 outline-none transition-all duration-200"
                        style="
                            transform: rotateX({-offsetAngle}deg) translateZ({RADIUS}px);
                            opacity: {opacity * 0.5}; /* Spacer 稍微暗一点 */
                            visibility: {opacity < 0.1 ? 'hidden' : 'visible'};
                        "
                    >
                         <span class="text-xl text-text-dim/20 font-light">
                             &times;
                         </span>
                    </div>
                {:else if group}
                    <button 
                        onclick={() => handleClick(virtualIdx)}
                        class="absolute right-0 top-1/2 -mt-[20px] w-full h-[40px] flex items-center justify-end pr-4 gap-3 outline-none cursor-pointer group transition-colors duration-200"
                        style="
                            transform: rotateX({-offsetAngle}deg) translateZ({RADIUS}px);
                            opacity: {opacity};
                            visibility: {opacity < 0.1 ? 'hidden' : 'visible'};
                        "
                    >
                        <span class={`
                            text-[11px] font-bold tracking-[0.1em] uppercase text-right truncate transition-all duration-300
                            ${isActive 
                                ? 'text-primary translate-x-0' 
                                : 'text-text-dim/40 group-hover:text-text-dim/70 translate-x-1 blur-[0.3px]'
                            }
                        `}>
                            {group.name}
                        </span>

                        <div class={`
                            h-[3px] rounded-l-sm transition-all duration-300
                            ${isActive 
                                ? 'w-3 bg-primary shadow-[0_0_8px_var(--color-primary)]' 
                                : 'w-1.5 bg-text-dim/20 group-hover:bg-text-dim/40'
                            }
                        `}></div>
                    </button>
                {/if}
            {/if}
        {/each}
    </div>

    <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[2px] w-1.5 h-4 bg-primary rounded-l-full shadow-sm z-50"></div>
</aside>