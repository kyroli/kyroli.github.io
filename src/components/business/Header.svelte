<script lang="ts">
  import { Search, X, Save, RotateCcw, Pencil, Settings, Loader2 } from 'lucide-svelte';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { sync } from '$lib/services/sync';
  import { UI_CONSTANTS } from '$lib/utils';
  import { MESSAGES } from '$lib/i18n';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';
  import ThemeSwitch from '../ui/ThemeSwitch.svelte';

  let search = $state('');
  
  const logoHref = $derived(
    !appState.isEditMode && dataState.config.owner && dataState.config.repo 
      ? `https://github.com/${dataState.config.owner}/${dataState.config.repo}` 
      : undefined
  );
  const isSyncing = $derived(dataState.syncStatus === 'syncing' || dataState.syncStatus === 'checking');

  function handleSearch() {
    if (!search.trim()) return;
    window.open(`${UI_CONSTANTS.SEARCH_ENGINE_URL}${encodeURIComponent(search)}`);
    search = '';
  }

  function handleEditClick() {
    if (!dataState.hasToken) { 
      appState.showToast(MESSAGES.TOAST.CONFIG_MISSING, 'error');
      return; 
    }
    appState.toggleEditMode();
  }
  
  function handleSync() {
    appState.openConfirm({
      msg: MESSAGES.CONFIRM.SYNC_CHANGES,
      onConfirm: () => sync.push()
    });
  }

  function handleReset() {
    appState.openConfirm({
      msg: MESSAGES.CONFIRM.DISCARD_CHANGES,
      onConfirm: () => sync.resetToRemote(),
      isDestructive: true
    });
  }
</script>

<div class="w-full mt-8 mb-8 relative">
  <header class="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-4">
    
    <div class="justify-self-start flex min-w-0">
      <a 
        href={logoHref} 
        target="_blank" 
        class={`flex items-center gap-3 transition-opacity active:scale-95 group ${!logoHref ? 'pointer-events-none' : 'hover:opacity-80'}`}
      >
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-solid group-hover:rotate-6 transition-transform">N</div>
        <div class="flex flex-col hidden sm:flex">
          <h1 class="font-bold text-xl tracking-tight select-none text-text leading-none">NAV-ZERO</h1>
          <span class="text-[11px] font-medium tracking-[0.1em] text-text-dim/60 uppercase">{MESSAGES.UI.SUBTITLE}</span>
        </div>
      </a>
    </div>
    
    <div class="relative w-full w-[480px] max-w-full justify-self-center">
      <Input 
        bind:value={search}
        onkeydown={e => e.key === 'Enter' && handleSearch()}
        class="px-11 py-3 text-sm shadow-sm bg-surface text-text placeholder:text-text-dim/40 transition-shadow focus:shadow-md"
        placeholder={MESSAGES.UI.SEARCH_PLACEHOLDER}
      />
      <Search onclick={handleSearch} class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim cursor-pointer hover:text-primary transition-colors" />
    </div>

    <div class="justify-self-end flex items-center justify-end">
      <div class="flex items-center gap-2 h-10">
        {#if appState.isEditMode}
          <div class="flex gap-2 animate-fade">
            <Button variant="ghost" size="icon" onclick={appState.toggleEditMode} class="text-text-dim" title={MESSAGES.UI.TIP_EXIT_EDIT}>
              <X class="w-5 h-5" />
            </Button>

            <Button 
              variant="primary" 
              size="icon" 
              onclick={handleSync} 
              title={isSyncing ? MESSAGES.UI.SYNCING : MESSAGES.UI.SAVE_AND_SYNC} 
              disabled={!dataState.isDirty || isSyncing}
            >
              {#if isSyncing}
                <Loader2 class="w-5 h-5 animate-spin" />
              {:else}
                <Save class="w-5 h-5" />
              {/if}
            </Button>

            <Button variant="danger" size="icon" onclick={handleReset} title={MESSAGES.UI.RESET}>
              <RotateCcw class="w-5 h-5" />
            </Button>
          </div>
        {:else}
          <div class="flex gap-3 animate-fade items-center">
            <ThemeSwitch />
            
            <Button variant="outline" size="icon" onclick={handleEditClick} title={MESSAGES.UI.TIP_ENTER_EDIT}>
              <Pencil class="w-5 h-5" />
            </Button>

            <div class="relative group">
              <Button 
                variant="outline" 
                size="icon"
                onclick={appState.openConfig} 
              >
                 <Settings class={`w-5 h-5 ${!dataState.hasToken ? 'text-text-dim' : ''}`} />
              </Button>

              {#if !dataState.hasToken}
                <div 
                  class="absolute right-0 top-full mt-2 w-max px-3 py-1.5 bg-text text-bg text-xs rounded-lg font-medium shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 translate-y-1 group-hover:translate-y-0 pointer-events-none"
                >
                  {MESSAGES.UI.TIP_CONFIG_TOKEN}
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </header>
</div>