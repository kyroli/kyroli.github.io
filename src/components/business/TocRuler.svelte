<script lang="ts">
  import { onMount } from 'svelte';
  import { dataState } from '$lib/core/data.svelte';

  // --- 3D 物理参数 ---
  const RADIUS = 260;      // [加大] 巨大的半径，模拟露出冰山一角的感觉
  const ITEM_ANGLE = 14;   // 刻度密度
  const VISIBLE_RANGE = 50;// 视野限制，只看最清晰的部分

  let scrollY = $state(0);
  let anchors = $state<number[]>([]);

  // --- 核心 1: 物理锚点测量 (保持不变) ---
  function measureAnchors() {
    if (dataState.groups.length === 0) return;
    const winHalf = window.innerHeight / 2;
    anchors = dataState.groups.map(g => {
        const el = document.querySelector(`[data-dnd-group-id="${g.id}"]`);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        return (rect.top + window.scrollY) + (rect.height / 2) - winHalf;
    });
  }

  // --- 核心 2: 智能插值 (保持不变) ---
  const currentVirtualIndex = $derived.by(() => {
    if (anchors.length === 0) return 0;
    let upperIndex = anchors.findIndex(a => a > scrollY);
    if (upperIndex === -1) upperIndex = anchors.length - 1;
    if (upperIndex === 0) return 0;

    const lowerIndex = upperIndex - 1;
    const start = anchors[lowerIndex];
    const end = anchors[upperIndex];

    if (Math.abs(end - start) < 1) return lowerIndex;
    const progress = (scrollY - start) / (end - start);
    return lowerIndex + progress;
  });

  function loop() {
    scrollY = window.scrollY;
    requestAnimationFrame(loop);
  }

  function handleNav(e: MouseEvent, id: string) {
    e.preventDefault();
    const el = document.querySelector(`[data-dnd-group-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleWheel(e: WheelEvent) {
    window.scrollBy({ top: e.deltaY, behavior: 'auto' });
  }

  onMount(() => {
    const raf = requestAnimationFrame(loop);
    setTimeout(measureAnchors, 500); 
    window.addEventListener('resize', measureAnchors);
    return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', measureAnchors);
    };
  });
  
  $effect(() => {
    if (dataState.groups.length > 0) setTimeout(measureAnchors, 200);
  });
</script>

<aside 
    class="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden xl:block h-[420px] w-48 select-none pointer-events-auto bg-surface/5 backdrop-blur-[2px] border-r border-border/60 rounded-r-2xl shadow-[inset_-10px_0_20px_-10px_rgba(0,0,0,0.05)]"
    onwheel={handleWheel}
    style="perspective: 1500px;" 
>
    <div class="absolute inset-0 z-20 pointer-events-none rounded-r-2xl overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-bg via-bg/80 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg via-bg/80 to-transparent"></div>
        
        <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent mix-blend-overlay"></div>
    </div>

    <div class="relative w-full h-full z-10" style="transform-style: preserve-3d;">
        {#each dataState.groups as group, i (group.id)}
            {@const deltaIndex = i - currentVirtualIndex}
            {@const angle = deltaIndex * ITEM_ANGLE}
            
            {#if Math.abs(angle) < VISIBLE_RANGE}
                {@const isActive = Math.abs(angle) < (ITEM_ANGLE / 1.5)}
                
                {@const opacity = Math.pow(1 - (Math.abs(angle) / VISIBLE_RANGE), 2)}

                <button 
                    onclick={(e) => handleNav(e, group.id)}
                    class="absolute right-0 top-1/2 -mt-[20px] w-full h-[40px] flex items-center justify-end pr-4 gap-3 outline-none cursor-pointer group transition-colors duration-200"
                    style="
                        transform: rotateX({-angle}deg) translateZ({RADIUS}px);
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
        {/each}
    </div>

    <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[2px] w-1.5 h-4 bg-primary rounded-l-full shadow-sm z-50"></div>
</aside>