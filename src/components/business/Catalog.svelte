<script lang="ts">
import { fade } from 'svelte/transition';
import { ANIMATION_SPEED } from '$lib/constants';
import { appState } from '$lib/core/app.svelte';
import { dataState } from '$lib/core/data.svelte';

let observer: IntersectionObserver | null = null;
let scrollY = $state(0);

const groupIds = $derived(dataState.groups.map((g) => g.id).join(','));

// Set of currently active group IDs
const activeGroupSet = $derived.by(() => {
  if (appState.visibleGroupIds.length > 0) {
    return new Set(appState.visibleGroupIds);
  }
  return new Set(dataState.groups[0] ? [dataState.groups[0].id] : []);
});

// Calculate the first active group ID for mobile auto-centering
const firstActiveGroupId = $derived.by(() => {
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

// Auto-center the first active category in the horizontal scrollbar on mobile
$effect(() => {
  if (firstActiveGroupId) {
    const btn = buttonEls.get(firstActiveGroupId);
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
          visibilityMap.set(id, entry.isIntersecting);
        }
      });

      appState.visibleGroupIds = Array.from(visibilityMap.entries())
        .filter(([_, visible]) => visible)
        .map(([id]) => id);
    },
    {
      threshold: [0, 0.1, 0.5, 0.9, 1.0],
      rootMargin: '-80px 0px -20% 0px'
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
    const targetY = rect.top + window.scrollY - 100;

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
    class="fixed left-12 top-1/2 -translate-y-1/2 hidden xl:flex flex-col z-40 max-h-[80vh] py-6 pr-4 overflow-y-auto no-scrollbar"
  >
    <div class="relative flex flex-col">
      <!-- Base vertical line -->
      <div class="absolute left-[9.5px] top-3 bottom-3 w-px bg-border/40 -z-10"></div>

      {#each dataState.groups as group, i (group.id)}
        {@const isActive = activeGroupSet.has(group.id)}
        {@const nextActive = i < dataState.groups.length - 1 && activeGroupSet.has(dataState.groups[i + 1].id)}

        <div class="relative flex flex-col">
          <button
            onclick={() => scrollToGroup(group.id)}
            class="group relative flex items-center gap-4 py-3 outline-none cursor-pointer"
          >
            <div class="relative flex items-center justify-center w-5 h-5 shrink-0">
                <div class="absolute w-full h-full bg-bg z-0 rounded-full scale-[0.6] opacity-0 transition-opacity duration-300"></div>
                <span 
                    class={`relative z-10 rounded-full transition-all duration-500 ease-out-expo ${
                    isActive 
                        ? 'w-2.5 h-2.5 bg-primary shadow-sm ring-4 ring-primary/20' 
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

          {#if i < dataState.groups.length - 1}
            <!-- Active connector line segment between adjacent active dots -->
            <div 
              class={`absolute left-[9.5px] top-6 bottom-0 w-px -z-10 transition-all duration-500 ${
                isActive && nextActive ? 'bg-primary w-0.5 -left-[0.25px]' : 'bg-transparent'
              }`}
            ></div>
          {/if}
        </div>
      {/each}
    </div>
  </aside>

  <!-- Mobile/narrow viewport horizontal scroll sticky navigation -->
  <nav
    in:fade={{ duration: ANIMATION_SPEED.FADE_SLOW }}
    class={`sticky top-0 z-30 w-full flex xl:hidden bg-bg border-b overflow-x-auto no-scrollbar transition-all duration-200 ${
      scrollY > 10 ? 'border-border py-2 px-5' : 'border-transparent py-3.5 px-5'
    }`}
  >
    <div class="flex items-center mx-auto md:mx-0 py-0.5">
      {#each dataState.groups as group, i (group.id)}
        {@const isActive = activeGroupSet.has(group.id)}
        {@const prevActive = i > 0 && activeGroupSet.has(dataState.groups[i - 1].id)}
        {@const nextActive = i < dataState.groups.length - 1 && activeGroupSet.has(dataState.groups[i + 1].id)}

        {@const roundedClass = isActive
          ? prevActive && nextActive
            ? 'rounded-none border-x-transparent z-10'
            : prevActive
              ? 'rounded-r-xl rounded-l-none border-l-transparent z-10'
              : nextActive
                ? 'rounded-l-xl rounded-r-none border-r-transparent z-10'
                : 'rounded-xl z-10'
          : 'rounded-xl border-transparent z-0'}

        {@const styleClass = isActive
          ? 'text-primary bg-surface border-border shadow-solid font-bold'
          : 'text-text-dim hover:text-text bg-transparent font-medium'}

        {@const mrClass = i < dataState.groups.length - 1
          ? isActive && nextActive ? '-mr-px' : 'mr-2'
          : ''}

        <button
          use:registerButton={group.id}
          onclick={() => scrollToGroup(group.id)}
          class={`flex items-center justify-center h-9 px-3.5 text-xs transition-all whitespace-nowrap cursor-pointer border active-press-icon ${roundedClass} ${styleClass} ${mrClass}`}
        >
          {group.name}
        </button>
      {/each}
    </div>
  </nav>
{/if}

<style>
  .ease-out-expo {
    transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
  }
</style>