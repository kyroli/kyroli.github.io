<script lang="ts">
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { MESSAGES } from '$lib/i18n';
  
  import SearchBar from './SearchBar.svelte';
  import HeaderControls from './HeaderControls.svelte';

  const logoHref = $derived(
    !appState.isEditMode && dataState.config.owner && dataState.config.repo 
      ? `https://github.com/${dataState.config.owner}/${dataState.config.repo}` 
      : undefined
  );
</script>

<div class="w-full mt-8 mb-8 relative">
  <header class="w-full grid grid-cols-2 md:grid-cols-[auto_1fr_auto] items-center gap-4">
    <div class="justify-self-start flex min-w-0">
      <a 
        href={logoHref} 
        target="_blank" 
        class={`flex items-center gap-3 transition-opacity active-press group ${!logoHref ? 'pointer-events-none' : 'hover:opacity-80'}`}
      >
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-solid group-hover:rotate-6 transition-transform">K</div>
        <div class="flex flex-col hidden sm:flex justify-center">
          <h1 class="font-bold text-xl tracking-tighter text-text leading-tight mb-0.5">{MESSAGES.UI.APP_NAME}</h1>
          <span class="text-[10px] font-bold tracking-widest text-text-dim/50 uppercase leading-tight">{MESSAGES.UI.SUBTITLE}</span>
        </div>
      </a>
    </div>
    
    <SearchBar />

    <HeaderControls />
  </header>
</div>