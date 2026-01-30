<script lang="ts">
  import { onMount } from 'svelte';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { sync } from '$lib/services/sync';
  import { MESSAGES } from '$lib/i18n';

  import Header from './components/business/Header.svelte';
  import SiteGrid from './components/business/SiteGrid.svelte';
  import LoadingSkeleton from './components/business/LoadingSkeleton.svelte';
  
  import ConfigModal from './components/modals/ConfigModal.svelte';
  import SiteModal from './components/modals/SiteModal.svelte';
  import GroupModal from './components/modals/GroupModal.svelte';
  import Modal from './components/ui/Modal.svelte';
  import Button from './components/ui/Button.svelte';

  onMount(() => {
    sync.init();
  });

  const toastClass = $derived(
    appState.toast?.type === 'error' 
      ? 'bg-danger/90 border-danger text-white' 
      : 'bg-zinc-800/90 dark:bg-zinc-900/90 border-zinc-700/50 text-white'
  );
</script>

{#if dataState.syncStatus === 'syncing'}
  <div class="fixed inset-0 z-[9999] cursor-wait bg-transparent"></div>
{/if}

<div class="min-h-screen w-full transition-colors duration-300 bg-bg text-text pb-20">
  <div class="w-full max-w-[1600px] mx-auto px-6 lg:px-12 2xl:px-24">
    <Header />

    <main>
      {#if dataState.isReady}
        {#if !dataState.hasToken && !appState.isConfigOpen}
          <div class="flex flex-col items-center justify-center py-10 opacity-50 text-text-dim animate-fade">
            <p class="font-bold">{MESSAGES.UI.TIP_CONFIG_GITHUB}</p>
          </div>
        {/if}
   
        <SiteGrid />
        
      {:else if dataState.syncError}
         <div class="flex flex-col items-center justify-center py-20 text-danger font-bold">
            <p>Error: {dataState.syncError}</p>
            <button onclick={() => appState.openConfig()} class="mt-4 underline cursor-pointer">{MESSAGES.UI.CHECK_CONFIG}</button>
          </div>
      {:else}
         <LoadingSkeleton />
      {/if}
    </main>
  </div>
  
  {#if appState.activeModal === 'config'}
    <ConfigModal onClose={appState.closeModal} />
  {/if}

  {#if appState.activeModal === 'site' && appState.editingGroupId}
    <SiteModal 
      groupId={appState.editingGroupId} 
      siteId={appState.editingSiteId} 
      onClose={appState.closeModal} 
    />
  {/if}

  {#if appState.activeModal === 'group'}
    <GroupModal 
      groupId={appState.editingGroupId}
      onClose={appState.closeModal}
    />
  {/if}

  {#if appState.activeModal === 'confirm' && appState.confirmPayload}
    <Modal onClose={appState.closeModal} title={MESSAGES.UI.CONFIRM_ACTION}>
       <div class="space-y-6 pt-2">
         <p class="text-text-dim font-bold text-sm leading-relaxed whitespace-pre-line">
           {appState.confirmPayload.msg}
         </p>
        <div class="flex gap-3">
          <Button variant="outline" onclick={appState.closeModal} class="flex-1 text-text-dim">{MESSAGES.UI.CANCEL}</Button>
          <Button 
            variant={appState.confirmPayload.isDestructive ? 'danger' : 'primary'} 
            onclick={() => { 
              appState.confirmPayload?.onConfirm();
              appState.closeModal(); 
            }} 
            class="flex-1"
          >
            {MESSAGES.UI.CONFIRM}
          </Button>
        </div>
      </div>
    </Modal>
  {/if}

  {#if appState.toast}
    <div class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] animate-fade w-full max-w-sm px-4 pointer-events-none">
      <div class={`px-6 py-4 rounded-xl shadow-2xl text-sm font-bold tracking-tight text-center transition-all backdrop-blur-md border-2 ${toastClass}`}>
        {appState.toast.msg}
      </div>
    </div>
  {/if}
</div>