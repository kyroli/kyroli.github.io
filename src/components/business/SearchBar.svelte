<script lang="ts">
  import { fade } from 'svelte/transition';
  import { Search } from 'lucide-svelte';
  import { appState } from '$lib/core/app.svelte';
  import Input from '../ui/Input.svelte';
  import { SEARCH_ENGINES, DEFAULT_ENGINE_ID } from '$lib/config/search';
  import { tooltip } from '$lib/actions/tooltip';
  import { ANIMATION_SPEED } from '$lib/constants';
  import { MESSAGES } from '$lib/i18n';

  let search = $state('');
  let initialEngineId = DEFAULT_ENGINE_ID;

  if (typeof window !== 'undefined') {
    const savedId = localStorage.getItem('nav_engine');
    if (savedId && SEARCH_ENGINES[savedId]) {
      initialEngineId = savedId;
    }
  }
  
  let currentEngineId = $state(initialEngineId);
  let showEngineMenu = $state(false);

  const activeEngine = $derived(SEARCH_ENGINES[currentEngineId]);

  function handleSearch() {
    if (!search.trim()) return;
    window.open(`${activeEngine.url}${encodeURIComponent(search.trim())}`);
    search = '';
  }

  function switchEngine(id: string) {
    currentEngineId = id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nav_engine', id);
    }
    showEngineMenu = false;
  }

  function clickOutside(node: HTMLElement) {
    const handleClick = (event: MouseEvent) => {
      if (!node.contains(event.target as Node)) {
        showEngineMenu = false;
      }
    };
    document.addEventListener('click', handleClick, true);
    return {
      destroy() {
        document.removeEventListener('click', handleClick, true);
      }
    };
  }
</script>

<div class="relative w-full col-span-2 md:col-span-1 md:w-full md:max-w-[640px] lg:max-w-[720px] justify-self-center order-last md:order-none z-20" use:clickOutside>
  <div class={`relative flex items-center w-full rounded-xl transition-all duration-200 bg-surface border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${showEngineMenu ? 'border-primary shadow-sm' : 'border-border shadow-solid hover:border-primary/50'}`}>
    <button onclick={() => showEngineMenu = !showEngineMenu} class="flex items-center justify-center pl-3 pr-2 h-10 rounded-l-xl text-text-dim hover:text-primary transition-colors cursor-pointer active:scale-95 shrink-0 gap-2 group/btn" use:tooltip={MESSAGES.UI.TIP_SWITCH_ENGINE}>
      <img src={activeEngine.icon} alt={activeEngine.name} class={`w-5 h-5 object-contain transition-transform duration-200 ${showEngineMenu ? 'rotate-12 scale-110' : 'group-hover/btn:scale-110'} ${appState.isDark ? 'invert' : ''}`} />
      <div class={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-current opacity-50 transition-transform duration-200 ${showEngineMenu ? 'rotate-180' : ''}`}></div>
    </button>

    <div class="h-5 w-[1px] bg-border/60 shrink-0"></div>

    <Input bind:value={search} name="search" autocomplete="off" onkeydown={e => e.key === 'Enter' && handleSearch()} class="border-none shadow-none bg-transparent focus:border-none focus:ring-0 h-10 py-0 pl-3 pr-2 text-sm placeholder:text-text-dim/60" placeholder={activeEngine.placeholder} />

    {#if search.trim().length > 0}
      <button transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }} onclick={handleSearch} class="mr-1 w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors active:scale-95 cursor-pointer" use:tooltip={MESSAGES.UI.SEARCH}>
        <Search class="w-4 h-4" />
      </button>
    {/if}
  </div>

  {#if showEngineMenu}
  <div transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }} class="absolute top-full left-0 mt-2 w-48 p-2 bg-surface border border-border rounded-xl shadow-float flex flex-col gap-1 origin-top-left z-50">
      {#each Object.values(SEARCH_ENGINES) as engine}
        <button onclick={() => switchEngine(engine.id)} class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 w-full text-left text-text hover:bg-bg active:scale-95">
          <img src={engine.icon} alt={engine.name} class={`w-4 h-4 object-contain ${appState.isDark ? 'invert' : ''}`} />
          <span class="flex-1">{engine.name}</span>
          {#if currentEngineId === engine.id}
            <div transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }} class="w-1.5 h-1.5 rounded-full bg-primary"></div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>