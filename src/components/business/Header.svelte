<script lang="ts">
  import { nav } from '$lib/nav.svelte';
  import { ui } from '$lib/ui.svelte';
  import { Search, X, Save, RotateCcw, Moon, Pencil, Settings } from 'lucide-svelte';
  import { UI_CONSTANTS } from '$lib/utils';
  import { MESSAGES } from '$lib/i18n';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let { onConfig } = $props<{ onConfig: () => void }>();
  let search = $state('');

  const logoHref = $derived(
    !ui.isEdit && nav.config.owner && nav.config.repo 
      ? `https://github.com/${nav.config.owner}/${nav.config.repo}` 
      : undefined
  );

  function handleSearch() {
    if (!search.trim()) return;
    window.open(`${UI_CONSTANTS.SEARCH_ENGINE_URL}${encodeURIComponent(search)}`);
    search = '';
  }

  function handleEditClick() {
      if (!nav.config.token) { 
          ui.showToast(MESSAGES.TOAST.CONFIG_MISSING, 'error');
          return; 
      }
      ui.toggleEdit();
  }
  
  const handleSync = () => nav.syncSafe();
  const handleReset = () => nav.resetSafe();
</script>

<div class="w-full mt-8 mb-8 relative">
  <header class="w-full flex flex-col md:flex-row justify-between items-center gap-5">
    {#if logoHref}
      <a href={logoHref} target="_blank" class={`flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95 group ${ui.isEdit ? 'pointer-events-none' : ''}`}>
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:rotate-6 transition-transform">N</div>
        <div class="flex flex-col">
          <h1 class="font-bold text-xl tracking-tight select-none text-text leading-none">NAV-ZERO</h1>
          <span class="text-[10px] font-mono text-text-dim/60 tracking-widest uppercase">Personal Startpage</span>
        </div>
      </a>
    {:else}
      <div class="flex items-center gap-3 select-none">
         <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm">N</div>
        <div class="flex flex-col">
          <h1 class="font-bold text-xl tracking-tight text-text leading-none">NAV-ZERO</h1>
          <span class="text-[10px] font-mono text-text-dim/60 tracking-widest uppercase">Personal Startpage</span>
        </div>
      </div>
    {/if}
    
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
        {#if ui.isEdit}
            <div class="flex gap-2 animate-fade">
                <Button variant="ghost" onclick={() => ui.toggleEdit()} class="w-10 h-10 !rounded-xl !p-0 text-text-dim" title={MESSAGES.UI.TIP_EXIT_EDIT}>
                     <X class="w-5 h-5" />
                </Button>

                <Button variant="primary" onclick={() => ui.openConfirm(MESSAGES.CONFIRM.SYNC_CHANGES, handleSync)} class="h-10 w-28 !rounded-xl" title={MESSAGES.UI.SAVE_AND_SYNC} disabled={!nav.isDirty}>
                     <span class="mr-1">{MESSAGES.UI.SAVE}</span>
                    <Save class="w-5 h-5" />
                </Button>

                 <Button variant="danger" onclick={() => ui.openConfirm(MESSAGES.CONFIRM.DISCARD_CHANGES, handleReset)} class="h-10 w-28 !rounded-xl" title={MESSAGES.UI.RESET}>
                    <span class="mr-1">{MESSAGES.UI.RESET}</span>
                    <RotateCcw class="w-4 h-4" />
                </Button>
            </div>
        {:else}
           <div class="flex gap-2 animate-fade">
                <Button variant="outline" onclick={() => ui.toggleTheme()} class="w-10 h-10 !rounded-xl !p-0" title={MESSAGES.UI.TIP_SWITCH_THEME}>
                   <Moon class="w-5 h-5" />
                </Button>
            
                <Button variant="outline" onclick={handleEditClick} class="w-10 h-10 !rounded-xl !p-0" title={MESSAGES.UI.TIP_ENTER_EDIT}>
                    <Pencil class="w-5 h-5" />
                 </Button>

                <div class="relative group/tooltip">
                    <Button variant="outline" onclick={onConfig} class="w-10 h-10 !rounded-xl !p-0">
                      <Settings class="w-5 h-5" />
                    </Button>
                    {#if !nav.config.token}
                       <div class="absolute right-0 top-full mt-2 w-max px-3 py-1.5 bg-text text-bg text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 font-medium shadow-xl translate-y-1 group-hover/tooltip:translate-y-0">{MESSAGES.UI.TIP_CONFIG_TOKEN}</div>
                    {/if}
                 </div>
            </div>
        {/if}
      </div>
    </div>
  </header>
</div>