<script module lang="ts">
import type { Attachment } from 'svelte/attachments';
import { SvelteSet } from 'svelte/reactivity';

const visibleGroupIds = new SvelteSet<string>();
const groupEls = new Map<string, HTMLElement>();
const elementIds = new WeakMap<Element, string>();

let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = elementIds.get(entry.target);
          if (!id) continue;
          if (entry.isIntersecting) {
            visibleGroupIds.add(id);
          } else {
            visibleGroupIds.delete(id);
          }
        }
      },
      {
        threshold: 0,
        rootMargin: '-80px 0px -20% 0px'
      }
    );
  }
  return observer;
}

export function observeGroup(id: string): Attachment<HTMLElement> {
  return (node: HTMLElement) => {
    const io = getObserver();
    elementIds.set(node, id);
    groupEls.set(id, node);
    io.observe(node);

    return () => {
      io.unobserve(node);
      elementIds.delete(node);
      groupEls.delete(id);
      visibleGroupIds.delete(id);
      if (groupEls.size === 0) {
        observer?.disconnect();
        observer = null;
      }
    };
  };
}
</script>

<script lang="ts">
import { fade } from 'svelte/transition';
import { ANIMATION_SPEED } from '$lib/constants';
import { dataState } from '$lib/core/data.svelte';
import { MESSAGES } from '$lib/i18n';
import { prefersReducedMotion } from '$lib/utils';

let navEl = $state<HTMLElement | null>(null);

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

// Auto-center the first active category in the horizontal scrollbar on mobile
$effect(() => {
  if (firstActiveGroupId && navEl && navEl.offsetWidth > 0) {
    const btn = buttonEls.get(firstActiveGroupId);
    if (btn) {
      const targetLeft = btn.offsetLeft - navEl.clientWidth / 2 + btn.clientWidth / 2;
      navEl.scrollTo({
        left: targetLeft,
        behavior: prefersReducedMotion.current ? 'auto' : 'smooth'
      });
    }
  }
});

function scrollToGroup(id: string) {
  groupEls.get(id)?.scrollIntoView({
    behavior: prefersReducedMotion.current ? 'auto' : 'smooth',
    block: 'start'
  });
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

{#if dataState.groups.length > 1}
  <!-- Desktop left sidebar navigation -->
  <aside
    aria-label={MESSAGES.UI.CATEGORY_NAV}
    in:fade={{ duration: ANIMATION_SPEED.FADE_SLOW }}
    class="fixed left-[max(3rem,calc(50%-900px+3rem))] max-w-[168px] top-1/2 -translate-y-1/2 hidden xl:flex flex-col z-40 max-h-[80vh] py-6 pr-4 overflow-y-auto no-scrollbar"
  >
    <div class="relative flex flex-col border-l border-border min-w-0">
      {#each dataState.groups as group (group.id)}
        {@const isActive = isGroupActive(group.id)}

        <button
          type="button"
          aria-current={isActive ? 'true' : undefined}
          onclick={() => scrollToGroup(group.id)}
          class="group relative flex items-center h-9 pl-4 text-left cursor-pointer min-w-0 max-w-full"
        >
          <span
            class={[
              'absolute -left-px w-0.5 transition-all duration-200',
              isActive
                ? 'inset-y-0 bg-primary'
                : 'top-1/2 -translate-y-1/2 h-0 bg-transparent group-hover:h-4 group-hover:bg-text-dim/40'
            ]}
          ></span>

          <span
            class={[
              'text-xs font-bold truncate uppercase tracking-wide transition-colors duration-200',
              isActive
                ? 'text-text'
                : 'text-text-dim/40 group-hover:text-text-dim/80'
            ]}
          >
            {group.name}
          </span>
        </button>
      {/each}
    </div>
  </aside>

  <!-- Mobile/narrow viewport horizontal scroll sticky navigation -->
  <div class="catalog-sticky-wrap sticky top-0 z-30 xl:hidden -mx-6 lg:-mx-12">
    <nav
      bind:this={navEl}
      aria-label={MESSAGES.UI.CATEGORY_NAV}
      in:fade={{ duration: ANIMATION_SPEED.FADE_SLOW }}
      class="catalog-sticky-bar w-full flex bg-bg/90 backdrop-blur-md border-b overflow-x-auto no-scrollbar transition-colors duration-200 py-2.5 px-6 lg:px-12"
    >
      <div class="flex items-center mx-auto md:mx-0 py-0.5">
        {#each dataState.groups as group (group.id)}
          {@const isActive = isGroupActive(group.id)}

          <button
            type="button"
            data-active={isActive || undefined}
            aria-current={isActive ? 'true' : undefined}
            {@attach registerButton(group.id)}
            onclick={() => scrollToGroup(group.id)}
            class="catalog-pill px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap cursor-pointer border border-transparent rounded-xl text-text-dim/70 hover:text-text bg-transparent mr-2 last:mr-0 active-press-icon"
          >
            {group.name}
          </button>
        {/each}
      </div>
    </nav>
  </div>
{/if}

<style>
.catalog-pill[data-active] {
  color: var(--color-primary);
  background-color: var(--color-surface);
  border-color: var(--color-border);
  box-shadow: var(--shadow-solid);
  z-index: 10;
}

.catalog-pill[data-active]:has(+ .catalog-pill[data-active]) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right-color: transparent;
  margin-right: -1px;
}

.catalog-pill[data-active] + .catalog-pill[data-active] {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left-color: transparent;
}
</style>