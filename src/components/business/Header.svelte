<script lang="ts">
  import { Search, X, Save, RotateCcw, Moon, Pencil, Settings, CloudUpload, Loader2 } from 'lucide-svelte';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { sync } from '$lib/services/sync';
  import { UI_CONSTANTS } from '$lib/utils';
  import { MESSAGES } from '$lib/i18n';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let search = $state('');
  
  const logoHref = $derived(
    !appState.isEditMode && dataState.config.owner && dataState.config.repo 
      ? `https://github.com/${dataState.config.owner}/${dataState.config.repo}` 
      : undefined
  );

  const syncIcon = $derived.by(() => {
    if (dataState.syncStatus === 'syncing' || dataState.syncStatus === 'checking') return Loader2;
    return CloudUpload;
  });

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
  <header class="w-full flex flex-col md:flex-row justify-between items-center gap-5">
    <a 
      href={logoHref} 
      target="_blank" 
      class={`flex items-center gap-3 transition-opacity active:scale-95 group ${!logoHref ? 'pointer-events-none' : 'hover:opacity-80'}`}
    >
      <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:rotate-6 transition-transform">N</div>
      <div class="flex flex-col">
        <h1 class="font-bold text-xl tracking-tight select-none text-text leading-none">NAV-ZERO</h1>
        <span class="text-[10px] font-mono text-text-dim/60 tracking-widest uppercase">{MESSAGES.UI.SUBTITLE}</span>
      </div>
    </a>
    
    <div class="relative w-full md:w-[480px]">
      <Input 
        bind:value={search}
        onkeydown={e => e.key === 'Enter' && handleSearch()}
        class="px-11 py-3 text-base shadow-sm bg-surface/50 backdrop-blur-sm"
        placeholder={MESSAGES.UI.SEARCH_PLACEHOLDER}
      />
      <Search onclick={handleSearch} class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim cursor-pointer hover:text-primary transition-colors" />
    </div>

    <div class="flex flex-col items-end">
      <div class="flex items-center gap-2 h-10">
        {#if appState.isEditMode}
          <div class="flex gap-2 animate-fade">
            <Button variant="ghost" onclick={appState.toggleEditMode} class="w-10 h-10 !rounded-xl !p-0 text-text-dim" title={MESSAGES.UI.TIP_EXIT_EDIT}>
              <X class="w-5 h-5" />
            </Button>

            <Button 
              variant="primary" 
              onclick={handleSync} 
              class="h-10 px-4 !rounded-xl min-w-[100px]" 
              title={MESSAGES.UI.SAVE_AND_SYNC} 
              disabled={!dataState.isDirty || isSyncing}
            >
              {#if isSyncing}
                <Loader2 class="w-4 h-4 animate-spin mr-2" />
                <span>{MESSAGES.UI.SYNCING}</span>
              {:else}
                <span class="mr-2">{MESSAGES.UI.SAVE}</span>
                <Save class="w-4 h-4" />
              {/if}
            </Button>

            <Button variant="danger" onclick={handleReset} class="h-10 w-10 !rounded-xl !p-0" title={MESSAGES.UI.RESET}>
              <RotateCcw class="w-4 h-4" />
            </Button>
          </div>
        {:else}
          <div class="flex gap-2 animate-fade">
            <Button variant="outline" onclick={appState.toggleTheme} class="w-10 h-10 !rounded-xl !p-0" title={MESSAGES.UI.TIP_SWITCH_THEME}>
              <Moon class="w-5 h-5" />
            </Button>
            
            <Button variant="outline" onclick={handleEditClick} class="w-10 h-10 !rounded-xl !p-0" title={MESSAGES.UI.TIP_ENTER_EDIT}>
              <Pencil class="w-5 h-5" />
            </Button>

            <div class="relative group/tooltip">
              <Button variant="outline" onclick={appState.openConfig} class="w-10 h-10 !rounded-xl !p-0">
                <Settings class={`w-5 h-5 ${!dataState.hasToken ? 'text-text-dim' : ''}`} />
              </Button>
              {#if !dataState.hasToken}
                <div class="absolute right-0 top-full mt-2 w-max px-3 py-1.5 bg-text text-bg text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 font-medium shadow-xl translate-y-1 group-hover/tooltip:translate-y-0">
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