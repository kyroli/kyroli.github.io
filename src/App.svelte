<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { sync } from '$lib/services/sync';
  import { MESSAGES } from '$lib/i18n';
  
  import Header from './components/business/Header.svelte';
  import SiteGrid from './components/business/SiteGrid.svelte';
  import LoadingSkeleton from './components/business/LoadingSkeleton.svelte';
  
  import Modal from './components/ui/Modal.svelte';
  import Button from './components/ui/Button.svelte';
  import TooltipContainer from './components/ui/TooltipContainer.svelte';
  import { promoteToTopLayer } from '$lib/actions/popover';

  dataState.init();
  appState.init();

  let isMounted = $state(false);
  let showSkeleton = $state(false);

  onMount(() => {
    isMounted = true;
    sync.init();
    
    const timer = setTimeout(() => {
      if (!dataState.isReady) {
        showSkeleton = true;
      }
    }, 200);
    
    return () => clearTimeout(timer);
  });

  const toastClass = $derived(
    appState.toast?.type === 'error' 
      ? 'bg-danger border-danger text-white shadow-float' 
      : 'bg-surface border-border text-text shadow-float'
  );
</script>

<svelte:head>
  <title>{MESSAGES.UI.APP_NAME} - {MESSAGES.UI.SUBTITLE}</title>
</svelte:head>

<div class="min-h-screen w-full bg-bg text-text pb-20">
  <div class="w-full max-w-[1800px] mx-auto px-6 lg:px-12 2xl:pl-[240px] 2xl:pr-12 transition-[padding] duration-300">
    <Header />

    <main>
      {#if isMounted}
        {#if dataState.isReady}
          <div in:fade={{ duration: 300, delay: 50 }}>
            {#if !dataState.hasToken && appState.activeModal !== 'config'}
              <div transition:fade={{ duration: 200 }} class="flex flex-col items-center justify-center py-10 opacity-50 text-text-dim">
                <p class="font-bold">{MESSAGES.UI.TIP_CONFIG_GITHUB}</p>
              </div>
            {/if}
            <SiteGrid />
          </div>
        {:else if dataState.syncError}
          <div in:fade={{ duration: 200 }} class="flex flex-col items-center justify-center py-20 text-danger font-bold">
            <p>Error: {dataState.syncError}</p>
            <button onclick={() => appState.openConfig()} class="mt-4 underline cursor-pointer">{MESSAGES.UI.CHECK_CONFIG}</button>
          </div>
        {:else if showSkeleton}
          <div in:fade={{ duration: 200 }}>
            <LoadingSkeleton />
          </div>
        {/if}
      {/if}
    </main>
  </div>
  
  {#if appState.activeModal === 'config'}
    {#await import('./components/modals/ConfigModal.svelte') then { default: ConfigModal }}
      <ConfigModal onClose={appState.closeModal} />
    {/await}
  {/if}

  {#if appState.activeModal === 'site' && appState.editingGroupId}
    {#await import('./components/modals/SiteModal.svelte') then { default: SiteModal }}
      <SiteModal 
        groupId={appState.editingGroupId} 
        siteId={appState.editingSiteId} 
        onClose={appState.closeModal} 
      />
    {/await}
  {/if}

  {#if appState.activeModal === 'group'}
    {#await import('./components/modals/GroupModal.svelte') then { default: GroupModal }}
      <GroupModal 
        groupId={appState.editingGroupId}
        onClose={appState.closeModal}
      />
    {/await}
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

  <TooltipContainer />

  {#if appState.toast}
    <div 
      use:promoteToTopLayer
      popover="manual"
      transition:fade={{ duration: 200 }}
      class="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pointer-events-none bg-transparent m-0 p-0 border-none outline-none z-[10000]"
    >
      <div class={`px-6 py-4 rounded-xl text-sm font-bold tracking-tight text-center transition-all border ${toastClass}`}>
        {appState.toast.msg}
      </div>
    </div>
  {/if}
</div>