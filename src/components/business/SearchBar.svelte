<script lang="ts">
import { fade } from 'svelte/transition';
import { tooltip } from '$lib/actions/tooltip.svelte';
import { DEFAULT_ENGINE_ID, SEARCH_ENGINES } from '$lib/config/search';
import { ANIMATION_SPEED } from '$lib/constants';
import { appState } from '$lib/core/app.svelte';
import { dataState } from '$lib/core/data.svelte';
import { MESSAGES } from '$lib/i18n';
import type { Site } from '$lib/types';
import { getDomain, promoteToTopLayer, siteIcon } from '$lib/utils';
import Icon from '../ui/Icon.svelte';

let search = $state('');
let inputEl = $state<HTMLInputElement | null>(null);
let isFocused = $state(false);
let selectedIndex = $state(-1);

const activeEngine = $derived(
  SEARCH_ENGINES[appState.currentEngineId] ?? SEARCH_ENGINES[DEFAULT_ENGINE_ID]
);

const matchedSites = $derived.by(() => {
  const query = search.trim().toLowerCase();
  if (!query) return [];

  const results: Array<{ site: Site; groupName: string; hostname: string }> = [];
  for (const group of dataState.groups) {
    for (const site of group.sites) {
      const hostname = getDomain(site.url);
      if (site.name.toLowerCase().includes(query) || hostname.toLowerCase().includes(query)) {
        results.push({ site, groupName: group.name, hostname });
        if (results.length >= 6) return results;
      }
    }
  }
  return results;
});

function openSite(url: string) {
  window.open(url, '_blank', 'noopener');
  search = '';
  selectedIndex = -1;
}

function handleSearch() {
  if (selectedIndex >= 0 && matchedSites[selectedIndex]) {
    openSite(matchedSites[selectedIndex].site.url);
    return;
  }

  const query = search.trim();
  if (!query) return;
  window.open(`${activeEngine.url}${encodeURIComponent(query)}`, '_blank', 'noopener');
  search = '';
  selectedIndex = -1;
}

function handleInputKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' && matchedSites.length > 0) {
    e.preventDefault();
    selectedIndex = selectedIndex < matchedSites.length - 1 ? selectedIndex + 1 : 0;
  } else if (e.key === 'ArrowUp' && matchedSites.length > 0) {
    e.preventDefault();
    selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : matchedSites.length - 1;
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    if (search.length > 0) {
      search = '';
      selectedIndex = -1;
    } else {
      inputEl?.blur();
    }
  }
}

function handleWindowKeydown(e: KeyboardEvent) {
  if (appState.modal) return;

  if (
    (e.key === '/' && document.activeElement !== inputEl) ||
    ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
  ) {
    e.preventDefault();
    inputEl?.focus();
    inputEl?.select();
  }
}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="group/search relative w-full col-span-2 md:col-span-1 md:w-full md:max-w-[640px] lg:max-w-[720px] justify-self-center order-last md:order-none">
  <div
    style="anchor-name: --search-box"
    class="relative flex items-center w-full h-10 rounded-xl transition-all duration-200 bg-surface border border-border shadow-solid hover:border-primary/50 focus-ring group-has-[#search-engine-menu:popover-open]/search:border-primary group-has-[#search-engine-menu:popover-open]/search:shadow-xs"
  >
    <button
      type="button"
      popovertarget="search-engine-menu"
      class="flex items-center justify-center pl-3 pr-2 h-10 rounded-l-xl text-text-dim hover:text-primary transition-colors cursor-pointer active-press-icon shrink-0 gap-2"
      {@attach tooltip(MESSAGES.UI.TIP_SWITCH_ENGINE)}
    >
      <div class="relative w-5 h-5 overflow-hidden shrink-0 flex items-center justify-center">
        {#key appState.currentEngineId}
          <img
            in:fade={{ duration: ANIMATION_SPEED.FADE_FAST }}
            src={activeEngine.icon}
            alt={activeEngine.name}
            class="absolute inset-0 w-full h-full object-contain dark:invert"
          />
        {/key}
      </div>
      <div class="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-current opacity-50 transition-transform duration-200 group-has-[#search-engine-menu:popover-open]/search:rotate-180"></div>
    </button>

    <div class="h-5 w-px bg-border/60 shrink-0"></div>

    <form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="contents">
      <input
        bind:this={inputEl}
        bind:value={search}
        type="text"
        name="search"
        autocomplete="off"
        aria-label={activeEngine.placeholder}
        onfocus={() => (isFocused = true)}
        onblur={() => (isFocused = false)}
        oninput={() => (selectedIndex = -1)}
        onkeydown={handleInputKeydown}
        class="w-full h-full bg-transparent border-none outline-none pl-3 pr-2 text-sm text-text placeholder:text-text-dim/60"
        placeholder={activeEngine.placeholder}
      />

      {#if search.trim().length > 0}
        <button
          type="submit"
          transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }}
          class="mr-1 w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors active-press-icon cursor-pointer shrink-0"
          {@attach tooltip(MESSAGES.UI.SEARCH)}
        >
          <Icon name="search" class="w-4 h-4" />
        </button>
      {/if}
    </form>
  </div>

  {#if isFocused && matchedSites.length > 0}
    <div
      {@attach promoteToTopLayer}
      popover="manual"
      class="dropdown-popover search-results-popover p-2 bg-surface border border-border rounded-xl shadow-float overflow-hidden"
    >
      {#each matchedSites as item, idx (item.site.id)}
        <button
          type="button"
          aria-current={selectedIndex === idx ? 'true' : undefined}
          onmousedown={(e) => e.preventDefault()}
          onclick={() => openSite(item.site.url)}
          onmouseenter={() => (selectedIndex = idx)}
          class={[
            'flex items-center gap-3 px-3 py-2 rounded-lg text-left w-full transition-colors duration-150 cursor-pointer active-press',
            selectedIndex === idx ? 'bg-bg' : 'hover:bg-bg'
          ]}
        >
          <div class="shrink-0 w-7 h-7 rounded-lg bg-icon-bg flex items-center justify-center overflow-hidden border border-border/50 p-1.5">
            <img
              {@attach siteIcon(item.site.url)}
              alt={item.site.name}
              class="w-full h-full object-contain pointer-events-none"
            />
          </div>

          <div class="flex flex-col min-w-0 flex-1">
            <span
              class={[
                'text-sm font-bold truncate leading-tight',
                selectedIndex === idx ? 'text-primary' : 'text-text'
              ]}
            >
              {item.site.name}
            </span>
            <span class="text-[10px] font-bold font-mono text-text-dim/70 truncate leading-tight tracking-widest uppercase">
              {item.hostname}
            </span>
          </div>

          <span class="text-[10px] font-bold uppercase tracking-wider text-text-dim/60 px-2 py-0.5 rounded-md bg-bg shrink-0">
            {item.groupName}
          </span>
        </button>
      {/each}
    </div>
  {/if}

  <div
    id="search-engine-menu"
    popover="auto"
    class="dropdown-popover engine-popover p-2 w-48 bg-surface border border-border rounded-xl shadow-float overflow-visible"
  >
    {#each Object.values(SEARCH_ENGINES) as engine}
      <button
        type="button"
        popovertarget="search-engine-menu"
        popovertargetaction="hide"
        aria-current={appState.currentEngineId === engine.id ? 'true' : undefined}
        onclick={() => appState.setEngine(engine.id)}
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors duration-200 w-full text-left text-text hover:bg-bg cursor-pointer active-press-icon"
      >
        <img src={engine.icon} alt={engine.name} class="w-4 h-4 object-contain dark:invert" />
        <span class="flex-1">{engine.name}</span>
        {#if appState.currentEngineId === engine.id}
          <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
        {/if}
      </button>
    {/each}
  </div>
</div>
