<script lang="ts">
import { fade } from 'svelte/transition';
import { ANIMATION_SPEED } from '$lib/constants';
import { appState } from '$lib/core/app.svelte';
import { dataState } from '$lib/core/data.svelte';

let observer: IntersectionObserver | null = null;
let scrollY = $state(0);

const groupIds = $derived(dataState.groups.map((g) => g.id).join(','));

// Calculate the active group ID for mobile layout (first visible or first available)
const activeGroupId = $derived.by(() => {
  if (appState.visibleGroupIds.length > 0) {
    return appState.visibleGroupIds[0];
  }
  return dataState.groups[0]?.id || '';
});

// Map to store mobile nav button elements for auto-centering
const buttonEls = new Map<string, HTMLButtonElement>();

$effect(() => {
  groupIds;
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

// Auto-center the active category in the horizontal scrollbar on mobile
$effect(() => {
  if (activeGroupId) {
    const btn = buttonEls.get(activeGroupId);
    if (btn) {
      btn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }
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
    const targetY = rect.top + scrollTop - 100;

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  }
}

// Action to register elements in the map
function registerButton(node: HTMLButtonElement, id: string) {
  buttonEls.set(id, node);
  return {
    destroy() {
      buttonEls.delete(id);
    }
  };
}
</script>

<svelte:window bind:scrollY={scrollY} />

{#if dataState.groups.length > 0}
  <!-- Desktop left sidebar navigation -->
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

  <!-- Mobile/narrow viewport horizontal scroll sticky navigation -->
  <nav
    in:fade={{ duration: ANIMATION_SPEED.FADE_SLOW }}
    class={`sticky top-0 z-30 w-full flex 2xl:hidden bg-bg border-b overflow-x-auto no-scrollbar transition-all duration-200 ${
      scrollY > 10 ? 'border-border py-2 px-5' : 'border-transparent py-3.5 px-5'
    }`}
  >
    <div class="flex gap-2.5 mx-auto md:mx-0">
      {#each dataState.groups as group (group.id)}
        {@const isActive = activeGroupId === group.id}
        <button
          use:registerButton={group.id}
          onclick={() => scrollToGroup(group.id)}
          class={`flex items-center justify-center h-9 px-3.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer border active-press-icon ${
            isActive 
              ? 'text-primary bg-surface border-border shadow-solid' 
              : 'text-text-dim hover:text-text border-transparent bg-transparent'
          }`}
        >
          {group.name}
        </button>
      {/each}
    </div>
  </nav>
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