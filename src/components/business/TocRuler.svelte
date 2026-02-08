<script lang="ts">
  import { onMount } from 'svelte';
  import { dataState } from '$lib/core/data.svelte';

  const ITEM_HEIGHT = 44;

  let scrollY = $state(0);
  let containerH = $state(0);
  let isHovering = $state(false);

  const rulerTranslateY = $derived.by(() => {
    if (dataState.groups.length === 0) return 0;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return 0;

    const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
    
    const totalContentH = dataState.groups.length * ITEM_HEIGHT;
    const centerOffset = containerH / 2;
    
    const targetPos = progress * (totalContentH - ITEM_HEIGHT);
    
    return centerOffset - targetPos - (ITEM_HEIGHT / 2);
  });

  function loop() {
    scrollY = window.scrollY;
    requestAnimationFrame(loop);
  }

  function handleNav(id: string) {
    const el = document.querySelector(`[data-dnd-group-id="${id}"]`);
    if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  onMount(() => {
    const raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
</script>

<aside 
    class="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col w-40 h-[400px] select-none pointer-events-none"
    bind:clientHeight={containerH}
    onmouseenter={() => isHovering = true}
    onmouseleave={() => isHovering = false}
    style="mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%);"
>
    <div 
        class="relative flex flex-col w-full will-change-transform"
        style="transform: translateY({rulerTranslateY}px); transition: transform 0.1s linear;" 
    >
        {#each dataState.groups as group, i (group.id)}
            {@const itemCenterY = rulerTranslateY + (i * ITEM_HEIGHT) + (ITEM_HEIGHT / 2)}
            {@const distFromCenter = Math.abs(itemCenterY - (containerH / 2))}
            {@const normDist = Math.min(distFromCenter / 150, 1)} 
            
            {@const scale = 1.1 - (normDist * 0.3)}
            {@const opacity = 1 - (normDist * 0.7)}
            {@const xOffset = normDist * -10}

            <button 
                onclick={() => handleNav(group.id)}
                class="flex items-center justify-end w-full gap-4 cursor-pointer outline-none pointer-events-auto transition-colors"
                style="
                    height: {ITEM_HEIGHT}px;
                    opacity: {opacity};
                    transform: scale({scale}) translateX({xOffset}px);
                "
            >
                <span class="text-[10px] font-bold tracking-[0.2em] uppercase text-right truncate text-text">
                    {group.name}
                </span>

                <div 
                    class="h-[2px] rounded-full bg-current transition-colors duration-200"
                    class:bg-primary={normDist < 0.2} 
                    class:bg-text-dim={normDist >= 0.2}
                    style="
                        width: {24 - (normDist * 16)}px; 
                        box-shadow: {normDist < 0.1 ? '0 0 10px var(--color-primary)' : 'none'}
                    "
                ></div>
            </button>
        {/each}
    </div>
    
    <div class="absolute right-0 top-1/2 -translate-y-[1px] w-1.5 h-[2px] bg-primary rounded-l-full shadow-[0_0_8px_var(--color-primary)] z-50"></div>
</aside>