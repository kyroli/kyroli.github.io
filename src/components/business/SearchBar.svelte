<script lang="ts">
import { Search } from '@lucide/svelte';
import { fade } from 'svelte/transition';
import { tooltip } from '$lib/actions/tooltip';
import { DEFAULT_ENGINE_ID, SEARCH_ENGINES } from '$lib/config/search';
import { ANIMATION_SPEED } from '$lib/constants';
import { appState } from '$lib/core/app.svelte';
import { MESSAGES } from '$lib/i18n';
import { storage } from '$lib/infra/storage';
import Input from '../ui/Input.svelte';

let search = $state('');
let inputEl = $state<HTMLInputElement | null>(null);
let menuEl = $state<HTMLElement | null>(null);

const savedEngine = storage.engine;
let currentEngineId = $state(
  savedEngine && SEARCH_ENGINES[savedEngine] ? savedEngine : DEFAULT_ENGINE_ID
);
let isMenuOpen = $state(false);

const activeEngine = $derived(SEARCH_ENGINES[currentEngineId]);

function handleSearch() {
  if (!search.trim()) return;
  window.open(`${activeEngine.url}${encodeURIComponent(search.trim())}`);
  search = '';
}

function switchEngine(id: string) {
  currentEngineId = id;
  storage.engine = id;
  menuEl?.hidePopover();
}

function handleWindowKeydown(e: KeyboardEvent) {
  if (appState.activeModal) return;

  const target = e.target as HTMLElement | null;
  const isInputTarget =
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable);

  if (
    (e.key === '/' && !isInputTarget) ||
    ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
  ) {
    e.preventDefault();
    inputEl?.focus();
    inputEl?.select();
  } else if (e.key === 'Escape' && document.activeElement === inputEl) {
    inputEl?.blur();
  }
}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="relative w-full col-span-2 md:col-span-1 md:w-full md:max-w-[640px] lg:max-w-[720px] justify-self-center order-last md:order-none">
  <div class={`relative flex items-center w-full rounded-xl transition-all duration-200 bg-surface border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${isMenuOpen ? 'border-primary shadow-xs' : 'border-border shadow-solid hover:border-primary/50'}`}>
    <button
      type="button"
      popovertarget="search-engine-menu"
      style="anchor-name: --search-engine-anchor;"
      class="flex items-center justify-center pl-3 pr-2 h-10 rounded-l-xl text-text-dim hover:text-primary transition-colors cursor-pointer active-press-icon shrink-0 gap-2 group/btn"
      {@attach tooltip(isMenuOpen ? null : MESSAGES.UI.TIP_SWITCH_ENGINE)}
    >
      <div class="relative w-5 h-5 overflow-hidden shrink-0 flex items-center justify-center transition-transform duration-200 group-hover/btn:scale-110">
        {#key currentEngineId}
          <img 
            in:fade={{ duration: ANIMATION_SPEED.FADE_FAST }} 
            src={activeEngine.icon} 
            alt={activeEngine.name} 
            class={`absolute inset-0 w-full h-full object-contain ${appState.isDark ? 'invert' : ''}`} 
          />
        {/key}
      </div>
      <div class={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-current opacity-50 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}></div>
    </button>

    <div class="h-5 w-[1px] bg-border/60 shrink-0"></div>

    <Input bind:ref={inputEl} bind:value={search} name="search" autocomplete="off" onkeydown={e => e.key === 'Enter' && handleSearch()} class="border-none shadow-none bg-transparent focus:border-none focus:ring-0 h-10 py-0 pl-3 pr-2 text-sm placeholder:text-text-dim/60" placeholder={activeEngine.placeholder} />

    {#if search.trim().length > 0}
      <button transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }} onclick={handleSearch} class="mr-1 w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors active-press-icon cursor-pointer" {@attach tooltip(MESSAGES.UI.SEARCH)}>
        <Search class="w-4 h-4" />
      </button>
    {/if}
  </div>

  <div
    bind:this={menuEl}
    id="search-engine-menu"
    popover="auto"
    ontoggle={(e) => { isMenuOpen = e.newState === 'open'; }}
    class="engine-popover m-0 p-2 w-48 bg-surface border border-border rounded-xl shadow-float flex flex-col gap-1 overflow-visible"
    style="
      position-anchor: --search-engine-anchor;
      position-area: bottom span-right;
      position-try-fallbacks: flip-block;
      margin-block-start: 8px;
    "
  >
    {#each Object.values(SEARCH_ENGINES) as engine}
      <button type="button" onclick={() => switchEngine(engine.id)} class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 w-full text-left text-text hover:bg-bg active-press-icon">
        <img src={engine.icon} alt={engine.name} class={`w-4 h-4 object-contain ${appState.isDark ? 'invert' : ''}`} />
        <span class="flex-1">{engine.name}</span>
        {#if currentEngineId === engine.id}
          <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
        {/if}
      </button>
    {/each}
  </div>
</div>
