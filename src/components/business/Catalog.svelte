<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import { SvelteSet } from 'svelte/reactivity';
import { scrollY } from 'svelte/reactivity/window';
import { fade } from 'svelte/transition';
import { ANIMATION_SPEED } from '$lib/constants';
import { dataState } from '$lib/core/data.svelte';

let observer: IntersectionObserver | null = null;
let navEl = $state<HTMLElement | null>(null);

const visibleGroupIds = new SvelteSet<string>();
const groupIds = $derived(dataState.groups.map((g) => g.id).join(','));

function isGroupActive(id: string): boolean {
  return visibleGroupIds.size > 0 ? visibleGroupIds.has(id) : dataState.groups[0]?.id === id;
}

// Calculate the first active group ID for mobile auto-centering
const firstActiveGroupId = $derived(
  visibleGroupIds.size > 0
    ? (dataState.groups.find((g) => visibleGroupIds.has(g.id))?.id ?? '')
    : (dataState.groups[0]?.id ?? '')
);

// Map to store mobile nav button elements for auto-centering
const buttonEls = new Map<string, HTMLButtonElement>();

$effect(() => {
  groupIds;

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
  if (firstActiveGroupId && navEl && navEl.offsetWidth > 0) {
    const btn = buttonEls.get(firstActiveGroupId);
    if (btn) {
      const targetLeft = btn.offsetLeft - navEl.clientWidth / 2 + btn.clientWidth / 2;
      navEl.scrollTo({
        left: targetLeft,
        behavior: 'smooth'
      });
    }
  }
});

function setupObserver() {
  if (observer) {
    observer.disconnect();
  }
  visibleGroupIds.clear();

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.getAttribute('data-dnd-group-id');
        if (!id) continue;
        if (entry.isIntersecting) {
          visibleGroupIds.add(id);
        } else {
          visibleGroupIds.delete(id);
        }
      }
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

// Attachment to register button elements in the map
function registerButton(id: string): Attachment<HTMLButtonElement> {
  return (node: HTMLButtonElement) => {
    buttonEls.set(id, node);
    return () => {
      buttonEls.delete(id);
    };
  };
}
</script>

{#if dataState.groups.length > 0}
  <!-- Desktop left sidebar navigation -->
  <aside 
    in:fade={{ duration: ANIMATION_SPEED.FADE_SLOW }}
    class="fixed left-12 top-1/2 -translate-y-1/2 hidden xl:flex flex-col z-40 max-h-[80vh] py-6 pr-4 overflow-y-auto no-scrollbar"
  >
    <div class="relative flex flex-col border-l border-border">
      {#each dataState.groups as group (group.id)}
        {@const isActive = isGroupActive(group.id)}

        <button
          onclick={() => scrollToGroup(group.id)}
          class="group relative flex items-center h-9 pl-4 text-left outline-none cursor-pointer"
        >
          <span 
            class={`absolute -left-px w-0.5 transition-all duration-200 ${
              isActive 
                ? 'inset-y-0 bg-primary' 
                : 'top-1/2 -translate-y-1/2 h-0 bg-transparent group-hover:h-4 group-hover:bg-text-dim/40'
            }`}
          ></span>

          <span 
            class={`text-xs font-bold whitespace-nowrap transition-colors duration-200 ${
              isActive 
                ? 'text-text' 
                : 'text-text-dim/40 group-hover:text-text-dim/80'
            }`}
          >
            {group.name}
          </span>
        </button>
      {/each}
    </div>
  </aside>

  <!-- Mobile/narrow viewport horizontal scroll sticky navigation -->
  <nav
    bind:this={navEl}
    in:fade={{ duration: ANIMATION_SPEED.FADE_SLOW }}
    class={`sticky top-0 z-30 w-full flex xl:hidden bg-bg border-b overflow-x-auto no-scrollbar transition-all duration-200 ${
      (scrollY.current ?? 0) > 10 ? 'border-border py-2 px-5' : 'border-transparent py-3.5 px-5'
    }`}
  >
    <div class="flex items-center mx-auto md:mx-0 py-0.5">
      {#each dataState.groups as group, i (group.id)}
        {@const isActive = isGroupActive(group.id)}
        {@const prevActive = i > 0 && isGroupActive(dataState.groups[i - 1].id)}
        {@const nextActive = i < dataState.groups.length - 1 && isGroupActive(dataState.groups[i + 1].id)}

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
          ? 'font-bold text-primary bg-surface border-border shadow-solid'
          : 'font-bold text-text-dim/70 hover:text-text bg-transparent'}

        {@const mrClass = i < dataState.groups.length - 1
          ? isActive && nextActive ? '-mr-px' : 'mr-2'
          : ''}

        <button
          {@attach registerButton(group.id)}
          onclick={() => scrollToGroup(group.id)}
          class={`px-4 py-2 text-xs transition-all whitespace-nowrap cursor-pointer border active-press-icon ${roundedClass} ${styleClass} ${mrClass}`}
        >
          {group.name}
        </button>
      {/each}
    </div>
  </nav>
{/if}