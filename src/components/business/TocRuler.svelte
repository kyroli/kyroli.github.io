<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { dataState } from '$lib/core/data.svelte';
  import { uiState } from '$lib/core/ui.svelte';

  let activeIndex = $state(0);
  
  let sidebarContainer: HTMLElement;
  let itemRefs: HTMLElement[] = [];
  
  let groupWeights: number[] = [];
  
  let isLocked = false;
  let scrollTimeout: number | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function handleClick(index: number, groupId: string) {
    activeIndex = index;
    isLocked = true; 

    const el = uiState.getGroupNode(groupId);
    if (el) {
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });

        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => { isLocked = false; }, 800);
    }
  }

  function calculateWeights() {
    const groups = dataState.groups;
    if (groups.length === 0) return;

    const heights: number[] = [];
    let totalContentHeight = 0;
    
    groups.forEach(g => {
        const el = uiState.getGroupNode(g.id);
        const h = el ? el.getBoundingClientRect().height : 100;
        const effectiveH = h + 40; 
        heights.push(effectiveH);
        totalContentHeight += effectiveH;
    });

    groupWeights = heights.map(h => h / totalContentHeight);
  }

  function onScroll() {
    if (isLocked) return;
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (maxScroll <= 0) {
        activeIndex = 0;
        return;
    }

    let globalProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
    
    if (groupWeights.length === 0) calculateWeights();

    let accumulatedWeight = 0;
    let currentGroupIndex = 0;

    for (let i = 0; i < groupWeights.length; i++) {
        const weight = groupWeights[i];
        const end = accumulatedWeight + weight;
        const effectiveEnd = (i === groupWeights.length - 1) ? 1.0001 : end;

        if (globalProgress >= accumulatedWeight && globalProgress < effectiveEnd) {
            currentGroupIndex = i;
            break;
        }
        accumulatedWeight += weight;
    }

    if (activeIndex !== currentGroupIndex) {
        activeIndex = currentGroupIndex;

        if (sidebarContainer && itemRefs[currentGroupIndex]) {
            const item = itemRefs[currentGroupIndex];
            const container = sidebarContainer;
            const top = item.offsetTop - (container.clientHeight / 2) + (item.clientHeight / 2);
            container.scrollTo({ top, behavior: 'smooth' });
        }
    }
  }

  onMount(() => {
    setTimeout(() => {
        calculateWeights();
        onScroll();
    }, 200);

    window.addEventListener('scroll', onScroll, { passive: true });
    
    resizeObserver = new ResizeObserver(() => {
        calculateWeights();
        onScroll();
    });
    resizeObserver.observe(document.body);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', onScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
        resizeObserver?.disconnect();
    }
  });
</script>

<aside 
    class="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden 2xl:flex flex-row gap-0 pointer-events-auto select-none h-auto max-h-[60vh]"
>
    <div 
        bind:this={sidebarContainer}
        class="flex flex-col gap-1 overflow-y-auto px-2 py-4"
        style="scrollbar-width: none; -ms-overflow-style: none;"
    >
        {#each dataState.groups as group, i (group.id)}
            <button 
                bind:this={itemRefs[i]}
                onclick={() => handleClick(i, group.id)}
                class="group flex items-center gap-3 h-8 text-left outline-none transition-all duration-300 origin-left"
                data-active={activeIndex === i}
            >
                <span class="font-mono text-[10px] transition-all duration-300
                    text-text-dim opacity-20
                    group-hover:opacity-50
                    group-data-[active=true]:text-primary 
                    group-data-[active=true]:opacity-100
                    group-data-[active=true]:font-bold"
                >
                    {String(i + 1).padStart(2, '0')}
                </span>

                <span class="text-xs font-bold tracking-widest uppercase transition-all duration-300 truncate max-w-[140px]
                    text-text-dim opacity-20 scale-95
                    group-hover:opacity-60 group-hover:scale-100
                    group-data-[active=true]:text-text 
                    group-data-[active=true]:opacity-100 
                    group-data-[active=true]:scale-100"
                >
                    {group.name}
                </span>

                <span class="w-1 h-1 rounded-full bg-primary opacity-0 scale-0 transition-all duration-300 
                    group-data-[active=true]:opacity-100 group-data-[active=true]:scale-100">
                </span>
            </button>
        {/each}
    </div>
</aside>