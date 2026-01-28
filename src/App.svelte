<script lang="ts">
  // 1. Imports
  import { onMount } from 'svelte';
  import { app } from '$lib/store.svelte';
  
  // Components
  import Header from './components/business/Header.svelte';
  import SiteGrid from './components/business/SiteGrid.svelte';
  import LoadingSkeleton from './components/business/LoadingSkeleton.svelte';
  import ConfigModal from './components/modals/ConfigModal.svelte';
  import SiteModal from './components/modals/SiteModal.svelte';
  import Modal from './components/ui/Modal.svelte';
  import Button from './components/ui/Button.svelte';

  // 2. State
  let showConfig = $state(false);
  let editingSite = $state<{groupId: string, siteId?: string} | null>(null);

  // 3. Derived
  const needsConfig = $derived(app.status === 'ready' && !app.config.token);
  const showConfigTip = $derived(needsConfig && !showConfig);
  const isSyncingOrLoading = $derived(app.status === 'syncing' || app.status === 'loading');
  const isReady = $derived(app.status === 'ready');
  const isError = $derived(app.status === 'error');
  
  const toastClass = $derived(
    app.toast?.type === 'error' 
      ? 'bg-danger/90 border-danger text-white' 
      : 'bg-zinc-800/90 dark:bg-zinc-900/90 border-zinc-700/50 text-white'
  );

  // 4. Effects / Lifecycle
  onMount(() => {
    app.init().catch(() => {});
  });

  // 5. Visual Constants
  const containerClass = "w-full max-w-[1600px] mx-auto px-6 lg:px-12 2xl:px-24";
  const mainClass = "min-h-screen w-full transition-colors duration-300 bg-bg text-text pb-20";
  const syncBadgeClass = "fixed bottom-8 right-8 bg-primary text-white px-4 py-2 rounded-full shadow-lg animate-bounce text-xs font-bold z-[999]";
  const toastWrapperClass = "fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] animate-fade w-full max-w-sm px-4 pointer-events-none";
  const toastBaseClass = "px-6 py-4 rounded-xl shadow-2xl text-sm font-bold tracking-tight text-center transition-all backdrop-blur-md border-2";
  const configTipClass = "flex flex-col items-center justify-center py-10 opacity-50 text-text-dim animate-fade";
  const errorWrapperClass = "flex flex-col items-center justify-center py-20 text-danger font-bold";
</script>

{#if app.isSyncing}
  <div class="fixed inset-0 z-[9999] cursor-wait bg-transparent"></div>
{/if}

<div class={mainClass}>
  <div class={containerClass}>
    
    <Header onConfig={() => showConfig = true} />

    {#if isReady}
      {#if showConfigTip}
        <div class={configTipClass}>
          <p class="font-bold">请点击右上角配置 GitHub 连接</p>
        </div>
      {/if}
  
      <SiteGrid 
        onEditSite={(groupId, siteId) => editingSite = { groupId, siteId }}
        onAddSite={(groupId) => editingSite = { groupId }}
      />
      
    {:else if isSyncingOrLoading}
      <div class={syncBadgeClass}>
        同步中...
      </div>
      
    {:else if isError}
       <div class={errorWrapperClass}>
          <p>错误: {app.errorMsg}</p>
          <button onclick={() => showConfig = true} class="mt-4 underline cursor-pointer">检查配置</button>
       </div>
       
    {:else}
       <LoadingSkeleton />
    {/if}
  </div>

  {#if showConfig}
    <ConfigModal onClose={() => showConfig = false} />
  {/if}

  {#if editingSite}
    <SiteModal 
      groupId={editingSite.groupId} 
      siteId={editingSite.siteId} 
      onClose={() => editingSite = null} 
    />
  {/if}

  {#if app.confirmPayload}
    <Modal onClose={() => app.closeConfirm()} title="确认操作">
      <div class="space-y-6 pt-2">
         <p class="text-text-dim font-bold text-sm leading-relaxed">{app.confirmPayload.msg}</p>
        <div class="flex gap-3">
          <Button variant="outline" onclick={() => app.closeConfirm()} class="flex-1 text-text-dim">取消</Button>
          <Button variant="danger" onclick={() => { app.confirmPayload?.onConfirm(); app.closeConfirm(); }} class="flex-1">确定</Button>
        </div>
      </div>
    </Modal>
  {/if}

  {#if app.toast}
    <div class={toastWrapperClass}>
      <div class={`${toastBaseClass} ${toastClass}`}>
        {app.toast.msg}
      </div>
    </div>
  {/if}
</div>