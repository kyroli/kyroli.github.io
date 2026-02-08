<script lang="ts">
  import { onMount } from 'svelte';
  import { dataState } from '$lib/core/data.svelte';

  // --- 物理参数调优 ---
  const RADIUS = 220;      // [增大] 半径越大，视觉越平缓，越不容易像 Ω
  const ITEM_ANGLE = 15;   // [减小] 刻度更密集一点，增加精密感
  const VISIBLE_RANGE = 60;// [限制] 只显示中间 60 度范围，消除边缘扭曲

  let scrollY = $state(0);
  let anchors = $state<number[]>([]); // 缓存每个分组的“中心锚点”坐标

  // --- 核心 1: 物理锚点测量 ---
  // 计算每个分组“滚动到屏幕正中间”时，对应的 scrollY 应该是多少
  function measureAnchors() {
    if (dataState.groups.length === 0) return;

    const winHalf = window.innerHeight / 2;
    anchors = dataState.groups.map(g => {
        const el = document.querySelector(`[data-dnd-group-id="${g.id}"]`);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        // 元素的绝对顶部位置 = 当前相对顶部 + 已滚动的距离
        const absoluteTop = rect.top + window.scrollY;
        // 目标 scrollY = 元素中心绝对位置 - 屏幕一半高度
        // 这样当 scrollY 到达这个值时，元素正好在屏幕中间
        return absoluteTop + (rect.height / 2) - winHalf;
    });
  }

  // --- 核心 2: 智能非线性插值 ---
  const currentVirtualIndex = $derived.by(() => {
    if (anchors.length === 0) return 0;

    // 1. 找到 scrollY 落在哪个区间 ( anchor[i] <= scrollY < anchor[i+1] )
    // 我们找第一个“大于”当前 scrollY 的锚点，它的前一个就是当前锚点
    let upperIndex = anchors.findIndex(a => a > scrollY);
    
    // 边界处理
    if (upperIndex === -1) upperIndex = anchors.length - 1; // 超过最后一个
    if (upperIndex === 0) return 0; // 小于第一个

    const lowerIndex = upperIndex - 1;
    const start = anchors[lowerIndex];
    const end = anchors[upperIndex];

    // 2. 计算区间内的进度 (0.0 ~ 1.0)
    // 防止除以零
    if (Math.abs(end - start) < 1) return lowerIndex;
    
    const progress = (scrollY - start) / (end - start);

    // 3. 最终索引 = 整数索引 + 小数进度
    return lowerIndex + progress;
  });

  function loop() {
    scrollY = window.scrollY;
    requestAnimationFrame(loop);
  }

  // 点击导航
  function handleNav(e: MouseEvent, id: string) {
    e.preventDefault();
    const el = document.querySelector(`[data-dnd-group-id="${id}"]`);
    if (el) {
        // 强制居中对齐
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // --- 核心 3: 鼠标滚轮直接驱动 ---
  function handleWheel(e: WheelEvent) {
    // 允许页面随滚轮滚动
    // 我们不需要 preventDefault，因为我们希望这个区域就像是页面的“一部分”
    // 但为了保证手感，我们可以显式调用 scrollBy
    window.scrollBy({ top: e.deltaY, behavior: 'auto' });
  }

  onMount(() => {
    const raf = requestAnimationFrame(loop);
    
    // 初始化测量
    setTimeout(measureAnchors, 500); 
    // 监听窗口缩放重新测量
    window.addEventListener('resize', measureAnchors);

    return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', measureAnchors);
    };
  });
  
  // 当数据加载或变化时，重新测量高度
  $effect(() => {
    if (dataState.groups.length > 0) {
        // 给一点时间让 DOM 渲染完成
        setTimeout(measureAnchors, 200);
    }
  });
</script>

<aside 
    class="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:block h-[320px] w-48 select-none pointer-events-auto"
    onwheel={handleWheel}
    style="
        perspective: 1000px; 
        mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
    "
>
    <div class="relative w-full h-full" style="transform-style: preserve-3d;">
        {#each dataState.groups as group, i (group.id)}
            {@const deltaIndex = i - currentVirtualIndex}
            {@const angle = deltaIndex * ITEM_ANGLE}
            
            {#if Math.abs(angle) < VISIBLE_RANGE}
                {@const absAngle = Math.abs(angle)}
                {@const opacity = Math.pow(1 - (absAngle / VISIBLE_RANGE), 1.5)}
                {@const isActive = absAngle < (ITEM_ANGLE / 1.5)}

                <button 
                    onclick={(e) => handleNav(e, group.id)}
                    class="absolute left-0 top-1/2 -mt-[20px] w-full h-[40px] flex items-center justify-end gap-4 outline-none cursor-pointer group transition-colors duration-200"
                    style="
                        transform: rotateX({-angle}deg) translateZ({RADIUS}px);
                        opacity: {opacity};
                        visibility: {opacity < 0.05 ? 'hidden' : 'visible'};
                    "
                >
                    <span class={`
                        text-[11px] font-bold tracking-[0.15em] uppercase text-right truncate transition-all duration-200
                        ${isActive 
                            ? 'text-primary scale-110 drop-shadow-md' 
                            : 'text-text-dim/50 group-hover:text-text-dim scale-95'
                        }
                    `}>
                        {group.name}
                    </span>

                    <div class={`
                        h-[2px] rounded-full transition-all duration-200
                        ${isActive 
                            ? 'w-10 bg-primary shadow-[0_0_12px_var(--color-primary)]' 
                            : 'w-4 bg-text-dim/30 group-hover:w-6 group-hover:bg-text-dim/50'
                        }
                    `}></div>
                </button>
            {/if}
        {/each}
    </div>

    <div class="absolute right-[-12px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-primary/80 drop-shadow-[0_0_8px_var(--color-primary)]"></div>
</aside>