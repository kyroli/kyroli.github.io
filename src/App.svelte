<script lang="ts">
  import { onMount } from 'svelte';
  import { nav } from '$lib/nav.svelte';
  import { ui } from '$lib/ui.svelte';

  import Header from './components/business/Header.svelte';
  import SiteGrid from './components/business/SiteGrid.svelte';
  import LoadingSkeleton from './components/business/LoadingSkeleton.svelte';
  import ConfigModal from './components/modals/ConfigModal.svelte';
  import SiteModal from './components/modals/SiteModal.svelte';
  import Modal from './components/ui/Modal.svelte';
  import Button from './components/ui/Button.svelte';

  let showConfig = $state(false);
  let editingSite = $state<{groupId: string, siteId?: string} | null>(null);

  const needsConfig = $derived(nav.status === 'ready' && !nav.config.token);
  const showConfigTip = $derived(needsConfig && !showConfig);
  const isSyncingOrLoading = $derived(nav.status === 'syncing' || nav.status === 'loading');
  const isReady = $derived(nav.status === 'ready');
  const isError = $derived(nav.status === 'error');
  
  const toastClass = $derived(
    ui.toast?.type === 'error' 
      ? 'bg-danger/90 border-danger text-white' 
      : 'bg-zinc-800/90 dark:bg-zinc-900/90 border-zinc-700/50 text-white'
  );

  onMount(() => {
    nav.init().catch(() => {});
  });

  const containerClass = "w-full max-w-[1600px] mx-auto px-6 lg:px-12 2xl:px-24";
  const mainClass = "min-h-screen w-full transition-colors duration-300 bg-bg text-text pb-20";
  const syncBadgeClass = "fixed bottom-8 right-8 bg-primary text-white px-4 py-2 rounded-full shadow-lg animate-bounce text-xs font-bold z-[999]";
  const toastWrapperClass = "fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] animate-fade w-full max-w-sm px-4 pointer-events-none";
  const toastBaseClass = "px-6 py-4 rounded-xl shadow-2xl text-sm font-bold tracking-tight text-center transition-all backdrop-blur-md border-2";
  const configTipClass = "flex flex-col items-center justify-center py-10 opacity-50 text-text-dim animate-fade";
  const errorWrapperClass = "flex flex-col items-center justify-center py-20 text-danger font-bold";
</script>

{#if nav.isSyncing}
  <div class="fixed inset-0 z-[9999] cursor-wait bg-transparent"></div>
{/if}

<div class={mainClass}>
  <div class={containerClass}>
    <Header onConfig={() => showConfig = true} />

    <main>
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
        <div class={syncBadgeClass}>同步中...</div>
      {:else if isError}
         <div class={errorWrapperClass}>
            <p>错误: {nav.errorMsg}</p>
            <button onclick={() => showConfig = true} class="mt-4 underline cursor-pointer">检查配置</button>
         </div>
      {:else}
         <LoadingSkeleton />
      {/if}
    </main>
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

  {#if ui.confirmPayload}
    <Modal onClose={() => ui.closeConfirm()} title="确认操作">
      <div class="space-y-6 pt-2">
         <p class="text-text-dim font-bold text-sm leading-relaxed">{ui.confirmPayload.msg}</p>
        <div class="flex gap-3">
          <Button variant="outline" onclick={() => ui.closeConfirm()} class="flex-1 text-text-dim">取消</Button>
          <Button variant="danger" onclick={() => { ui.confirmPayload?.onConfirm(); ui.closeConfirm(); }} class="flex-1">确定</Button>
        </div>
      </div>
    </Modal>
  {/if}

  {#if ui.toast}
    <div class={toastWrapperClass}>
      <div class={`${toastBaseClass} ${toastClass}`}>
        {ui.toast.msg}
      </div>
    </div>
  {/if}
</div>