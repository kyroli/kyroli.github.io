<script lang="ts">
  import { onMount } from 'svelte';
  import { dataState } from '$lib/core/data.svelte';

  // --- 滚轮物理参数配置 ---
  const RADIUS = 180;      // 滚轮半径 (px)，越大越平缓
  const ITEM_ANGLE = 20;   // 每个刻度的间隔角度 (度)
  const VISIBLE_RANGE = 70;// 可见范围角度 (超出这个角度隐藏，避免穿模)

  let scrollY = $state(0);
  
  // 核心：计算当前页面的“虚拟索引”
  // 页面从头滚到尾，对应滚轮从第0项转到第N项
  const currentVirtualIndex = $derived.by(() => {
    if (dataState.groups.length === 0) return 0;
    
    // 获取页面最大滚动距离
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return 0;

    // 进度 0.0 ~ 1.0
    const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
    
    // 映射到索引：确保最后一个分组也能滚到正中间
    return progress * (dataState.groups.length - 1);
  });

  // 动画循环：高性能读取滚动位置
  function loop() {
    scrollY = window.scrollY;
    requestAnimationFrame(loop);
  }

  // 导航点击：居中定位
  function handleNav(e: MouseEvent, id: string) {
    // 阻止默认行为，防止任何可能的干扰
    e.preventDefault();
    
    const el = document.querySelector(`[data-dnd-group-id="${id}"]`);
    if (el) {
        // 使用 scrollIntoView 的 block: 'center' 完美实现居中
        el.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' // 关键修改：对齐到屏幕正中间
        });
    }
  }

  onMount(() => {
    const raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
</script>

<aside 
    class="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden xl:block h-[360px] w-48 select-none pointer-events-none"
    style="
        perspective: 800px; 
        mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
    "
>
    <div 
        class="relative w-full h-full" 
        style="transform-style: preserve-3d;"
    >
        {#each dataState.groups as group, i (group.id)}
            {@const deltaIndex = i - currentVirtualIndex}
            {@const angle = deltaIndex * ITEM_ANGLE}
            
            {#if Math.abs(angle) < VISIBLE_RANGE}
                {@const absAngle = Math.abs(angle)}
                {@const opacity = 1 - (absAngle / VISIBLE_RANGE)}
                {@const isActive = absAngle < (ITEM_ANGLE / 2)}

                <button 
                    onclick={(e) => handleNav(e, group.id)}
                    class="absolute left-0 top-1/2 -mt-[20px] w-full h-[40px] flex items-center justify-end gap-3 outline-none pointer-events-auto cursor-pointer group transition-colors duration-200"
                    style="
                        transform: rotateX({-angle}deg) translateZ({RADIUS}px);
                        opacity: {Math.max(opacity, 0)};
                        visibility: {opacity <= 0 ? 'hidden' : 'visible'};
                    "
                >
                    <span class={`
                        text-[11px] font-bold tracking-[0.15em] uppercase text-right truncate transition-colors duration-200
                        ${isActive ? 'text-primary' : 'text-text-dim/60 group-hover:text-text-dim'}
                    `}>
                        {group.name}
                    </span>

                    <div class={`
                        h-[2px] rounded-full transition-all duration-200
                        ${isActive 
                            ? 'w-8 bg-primary shadow-[0_0_10px_var(--color-primary)]' 
                            : 'w-4 bg-text-dim/40 group-hover:w-5 group-hover:bg-text-dim/60'
                        }
                    `}></div>
                </button>
            {/if}
        {/each}
    </div>

    <div class="absolute right-[-10px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-primary opacity-50"></div>
</aside>