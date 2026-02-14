<script lang="ts">
  import { X, Save, RotateCcw, Pencil, Settings, Loader2, Cloud, CloudOff, CloudAlert, Check, WifiOff } from 'lucide-svelte';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { sync } from '$lib/services/sync';
  import { MESSAGES } from '$lib/i18n';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';
  import ThemeSwitch from '../ui/ThemeSwitch.svelte';
  import { SEARCH_ENGINES, DEFAULT_ENGINE_ID } from '$lib/config/search';

  let search = $state('');
  
  let savedId = localStorage.getItem('nav_engine') || DEFAULT_ENGINE_ID;
  if (!SEARCH_ENGINES[savedId]) savedId = DEFAULT_ENGINE_ID;

  let currentEngineId = $state(savedId);
  let showEngineMenu = $state(false);
  
  const activeEngine = $derived(SEARCH_ENGINES[currentEngineId]);
  const logoHref = $derived(
    !appState.isEditMode && dataState.config.owner && dataState.config.repo 
      ? `https://github.com/${dataState.config.owner}/${dataState.config.repo}` 
      : undefined
  );

  const isSyncing = $derived(dataState.syncStatus === 'syncing' || dataState.syncStatus === 'checking');
  const syncStatusConfig = $derived.by(() => {
    if (!appState.isOnline) {
      return { icon: WifiOff, color: 'text-text-dim', title: 'Offline Mode' };
    }
    if (!dataState.hasToken) {
      return { icon: CloudOff, color: 'text-text-dim/30', title: 'No Config' };
    }
    if (dataState.syncStatus === 'error' || dataState.syncStatus === 'conflict') {
      return { icon: CloudAlert, color: 'text-danger', title: 'Sync Error' };
    }
    if (isSyncing) {
      return { icon: Loader2, color: 'text-primary animate-spin', title: 'Syncing...' };
    }
    if (dataState.isDirty) {
      return { icon: Cloud, color: 'text-primary', title: 'Unsaved Changes' };
    }
    return { icon: Check, color: 'text-text-dim/50', title: 'All Saved' };
  });

  $effect(() => {
    if (dataState.syncStatus === 'conflict') {
       appState.openConfirm({
          msg: MESSAGES.CONFIRM.CONFLICT_FORCE,
          onConfirm: handleForcePush
       });
    }
  });

  function getSafeErrorMessage(e: unknown): string {
    if (dataState.syncError) return dataState.syncError;
    if (e instanceof Error) return e.message;
    return MESSAGES.ERRORS.UNKNOWN;
  }

  async function handleForcePush() {
    try {
      await sync.forcePush();
      appState.showToast(MESSAGES.TOAST.FORCE_PUSH_SUCCESS, 'success');
    } catch (e: unknown) {
      const msg = getSafeErrorMessage(e);
      appState.showToast(`${MESSAGES.TOAST.FORCE_PUSH_FAIL}: ${msg}`, 'error');
    }
  }

  function handleSearch() {
    if (!search.trim()) return;
    window.open(`${activeEngine.url}${encodeURIComponent(search.trim())}`);
    search = '';
  }

  function switchEngine(id: string) {
    currentEngineId = id;
    localStorage.setItem('nav_engine', id);
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
      onConfirm: async () => {
        appState.toggleEditMode();
        try {
          await sync.push();
          if (dataState.syncStatus === 'success') {
             appState.showToast(MESSAGES.TOAST.SYNC_SUCCESS, 'success');
          }
        } catch (e: unknown) {
           const msg = getSafeErrorMessage(e);
           appState.showToast(`${MESSAGES.TOAST.SYNC_FAIL_PREFIX}${msg}`, 'error');
        }
      }
    });
  }

  function handleReset() {
    appState.openConfirm({
      msg: MESSAGES.CONFIRM.DISCARD_CHANGES,
      onConfirm: async () => {
        try {
          await sync.resetToRemote();
          appState.toggleEditMode();
          appState.showToast(MESSAGES.TOAST.RESET_SUCCESS, 'success');
        } catch (e: unknown) {
          appState.showToast(MESSAGES.TOAST.RESET_FAIL, 'error');
        }
      },
      isDestructive: true
    });
  }
</script>

<div class="w-full mt-8 mb-8 relative">
  <header class="w-full grid grid-cols-2 md:grid-cols-[auto_1fr_auto] items-center gap-4">
    
    <div class="justify-self-start flex min-w-0">
      <a 
        href={logoHref} 
        target="_blank" 
        class={`flex items-center gap-3 transition-opacity active:scale-95 group ${!logoHref ? 'pointer-events-none' : 'hover:opacity-80'}`}
      >
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-solid group-hover:rotate-6 transition-transform">K</div>
        <div class="flex flex-col hidden sm:flex justify-center">
          <h1 class="font-bold text-xl tracking-tighter text-text leading-tight mb-0.5">{MESSAGES.UI.APP_NAME}</h1>
          <span class="text-[10px] font-bold tracking-widest text-text-dim/50 uppercase leading-tight">{MESSAGES.UI.SUBTITLE}</span>
        </div>
      </a>
    </div>
    
    
    <div 
      class="relative w-full col-span-2 md:col-span-1 md:w-full md:max-w-[640px] lg:max-w-[720px] justify-self-center order-last md:order-none z-20"
      use:clickOutside
    >
      <div class="absolute left-2 top-1/2 -translate-y-1/2 z-30">
        <button 
          onclick={() => showEngineMenu = !showEngineMenu}
          class="flex items-center justify-center w-8 h-8 rounded-lg text-text-dim hover:text-primary hover:bg-surface/50 transition-all cursor-pointer active:scale-95"
          title="Switch Search Engine"
        >
          <img 
            src={activeEngine.icon} 
            alt={activeEngine.name}
            class="w-5 h-5 object-contain transition-transform duration-300 {showEngineMenu ? 'rotate-12 scale-110' : ''} {appState.isDark ? 'invert' : ''}" 
          />
        </button>
      </div>

      <Input 
        bind:value={search}
        name="search"
        autocomplete="off"
        onkeydown={e => e.key === 'Enter' && handleSearch()}
        class="pl-12 pr-4 py-3 text-sm shadow-sm bg-surface text-text placeholder:text-text-dim/40 transition-shadow focus:shadow-md"
        placeholder={activeEngine.placeholder}
      />

      {#if showEngineMenu}
        <div class="absolute top-full left-0 mt-2 w-40 p-1.5 bg-surface/90 backdrop-blur-md border border-border/50 rounded-xl shadow-xl animate-fade flex flex-col gap-0.5 origin-top-left z-50">
          {#each Object.values(SEARCH_ENGINES) as engine}
            <button
              onclick={() => switchEngine(engine.id)}
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left {currentEngineId === engine.id ? 'text-primary' : 'text-text hover:bg-bg hover:text-primary'}"
            >
              <img 
                src={engine.icon} 
                alt={engine.name}
                class="w-4 h-4 object-contain {appState.isDark ? 'invert' : ''}" 
              />
              
              <span class="flex-1">{engine.name}</span>

              {#if currentEngineId === engine.id}
                <div class="w-1.5 h-1.5 rounded-full bg-primary animate-fade"></div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="justify-self-end flex items-center justify-end">
      <div class="flex items-center gap-3 h-10">
        
        <div class="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border/50" title={syncStatusConfig.title}>
          <svelte:component this={syncStatusConfig.icon} class={`w-4 h-4 ${syncStatusConfig.color}`} />
        </div>

        {#if appState.isEditMode}
          <div class="flex gap-3 animate-fade items-center">
            <button 
              onclick={appState.toggleEditMode}
              title={MESSAGES.UI.TIP_EXIT_EDIT}
              class="relative shrink-0 w-16 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer group active:scale-[0.98] hover:bg-surface/50 border border-transparent hover:border-border"
            >
              <X class="w-5 h-5 text-text-dim group-hover:text-primary transition-colors" />
            </button>

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

            <div class="relative">
              <Button 
                variant="outline" 
                size="icon" 
                onclick={handleEditClick} 
                title={MESSAGES.UI.TIP_ENTER_EDIT}
              >
                <Pencil class="w-5 h-5" />
              </Button>
            </div>

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