<script lang="ts">
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { ANIMATION_SPEED } from '$lib/constants';
  import { fade } from 'svelte/transition';

  let observer: IntersectionObserver | null = null;

  $effect(() => {
    // Rebind observer when groups change
    const _groups = dataState.groups;
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      setupObserver();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
  });

  function setupObserver() {
    if (observer) {
      observer.disconnect();
    }

    const visibilityMap = new Map<string, boolean>();

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-dnd-group-id');
          if (id) {
            // Use 0.98 threshold for "fully visible" to allow margin of error
            visibilityMap.set(id, entry.intersectionRatio >= 0.98);
          }
        });

        appState.visibleGroupIds = Array.from(visibilityMap.entries())
          .filter(([_, visible]) => visible)
          .map(([id]) => id);
      },
      {
        threshold: [0, 0.5, 0.98, 1.0],
        rootMargin: '-20px 0px -20px 0px'
      }
    );

    document.querySelectorAll('[data-dnd-group-id]').forEach((el) => {
      observer?.observe(el);
    });
  }

  function scrollToGroup(id: string) {
    const el = document.querySelector(`[data-dnd-group-id="${id}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      // Offset for header height
      const targetY = rect.top + scrollTop - 100;

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  }
</script>

{#if dataState.groups.length > 0}
  <aside 
    in:fade={{ duration: ANIMATION_SPEED.FADE_SLOW }}
    class="fixed left-12 top-1/2 -translate-y-1/2 hidden 2xl:flex flex-col z-40 max-h-[80vh] py-6 pr-4 overflow-y-auto no-scrollbar"
  >
    <div class="absolute left-[9.5px] top-10 bottom-10 w-px bg-border/40 -z-10"></div>

    {#each dataState.groups as group (group.id)}
      {@const isActive = appState.visibleGroupIds.includes(group.id)}
      <button
        onclick={() => scrollToGroup(group.id)}
        class="group relative flex items-center gap-4 py-3 outline-none"
      >
        <div class="relative flex items-center justify-center w-5 h-5 shrink-0">
            <div class="absolute w-full h-full bg-bg z-0 rounded-full scale-[0.6] opacity-0 transition-opacity duration-300"></div>
            <span 
                class={`relative z-10 rounded-full transition-all duration-500 ease-out-expo ${
                isActive 
                    ? 'w-2 h-2 bg-primary' 
                    : 'w-1.5 h-1.5 bg-border/80 group-hover:bg-text-dim/60 group-hover:scale-125'
                }`}
            ></span>
        </div>

        <span 
          class={`text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out-expo ${
            isActive 
              ? 'text-text translate-x-1' 
              : 'text-text-dim/40 group-hover:text-text-dim/80'
          }`}
        >
          {group.name}
        </span>
      </button>
    {/each}
  </aside>
{/if}

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .ease-out-expo {
    transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
  }
</style>