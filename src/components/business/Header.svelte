<script lang="ts">
import { appState } from '$lib/core/app.svelte';
import { dataState } from '$lib/core/data.svelte';
import { MESSAGES } from '$lib/i18n';
import HeaderControls from './HeaderControls.svelte';

import SearchBar from './SearchBar.svelte';

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
        class={`h-10 flex items-center gap-2.5 transition-opacity active-press ${!logoHref ? 'pointer-events-none' : 'hover:opacity-80'}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="w-7 h-7 text-primary shrink-0"
        >
          <path d="M8 5v14M16 5l-6.5 7L16 19" />
          <path d="M4.5 15.5c-1.8-1-2.5-2.8-1.5-4.5 1.5-2.6 7.5-4.2 13.4-3.5 3.6.4 5.6 2 4.8 3.8-.5 1.1-2.2 2-4.7 2.6" />
        </svg>
        <h1 class="font-bold text-xl tracking-tight text-text leading-none">{MESSAGES.UI.APP_NAME}</h1>
      </a>
    </div>
    
    <SearchBar />

    <HeaderControls />
  </header>
</div>