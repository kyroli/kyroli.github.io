<script lang="ts">
  import { nav } from '$lib/nav.svelte';
  import { ui } from '$lib/ui.svelte';
  import { Search, X, Save, RotateCcw, Moon, Pencil, Settings } from 'lucide-svelte';
  import { resolveError } from '$lib/utils';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let { onConfig } = $props<{ onConfig: () => void }>();
  let search = $state('');

  const logoHref = $derived(ui.isEdit ? undefined : "https://github.com/kyroli/kyroli.github.io");
  
  function handleSearch() {
    if (!search.trim()) return;
    window.open(`https://www.bing.com/search?q=${encodeURIComponent(search)}`);
    search = '';
  }

  function handleEditClick() {
      if (!nav.config.token) { 
          ui.showToast('请先配置 GitHub Token', 'error');
          return; 
      }
      ui.toggleEdit();
  }
  
  async function handleSync() {
      try {
          await nav.sync();
          ui.showToast('同步成功', 'success');
      } catch (e) {
          ui.showToast(`同步失败: ${resolveError(e)}`, 'error');
      }
  }

  async function handleReset() {
      try {
          await nav.reset();
          ui.showToast('已重置为云端版本', 'success');
      } catch (e) {
          ui.showToast('重置失败', 'error');
      }
  }
</script>

<div class="w-full mt-8 mb-8 relative">
  <header class="w-full flex flex-col md:flex-row justify-between items-center gap-5">
    <a href={logoHref} target="_blank" class={`flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95 group ${ui.isEdit ? 'pointer-events-none' : ''}`}>
      <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:rotate-6 transition-transform">N</div>
      <div class="flex flex-col">
        <h1 class="font-bold text-xl tracking-tight select-none text-text leading-none">NAV-ZERO</h1>
        <span class="text-[10px] font-mono text-text-dim/60 tracking-widest uppercase">Personal Startpage</span>
      </div>
    </a>
    
    <div class="relative w-full md:w-[480px]">
      <Input 
        bind:value={search}
        onkeydown={e => e.key === 'Enter' && handleSearch()}
        class="px-11 py-3 text-base shadow-sm bg-surface/50 backdrop-blur-sm"
        placeholder="Search..."
      />
      <Search onclick={handleSearch} class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim cursor-pointer hover:text-primary transition-colors" />
    </div>

    <div class="flex flex-col items-end">
      <div class="flex items-center gap-2 h-10">
        {#if ui.isEdit}
            <div class="flex gap-2 animate-fade">
                <Button variant="ghost" onclick={() => ui.toggleEdit()} class="w-10 h-10 !rounded-xl !p-0 text-text-dim" title="退出编辑">
                     <X class="w-5 h-5" />
                </Button>

                <Button variant="primary" onclick={() => ui.openConfirm('确定要同步当前修改到 GitHub 吗？', handleSync)} class="h-10 w-28 !rounded-xl" title="保存并同步" disabled={!nav.isDirty}>
                    <span class="mr-1">保存</span>
                    <Save class="w-5 h-5" />
                </Button>

                <Button variant="danger" onclick={() => ui.openConfirm('确定丢弃修改并重置吗？', handleReset)} class="h-10 w-28 !rounded-xl" title="重置">
                    <span class="mr-1">重置</span>
                    <RotateCcw class="w-4 h-4" />
                </Button>
            </div>
        {:else}
           <div class="flex gap-2 animate-fade">
                <Button variant="outline" onclick={() => ui.toggleTheme()} class="w-10 h-10 !rounded-xl !p-0" title="切换主题">
                    <Moon class="w-5 h-5" />
                </Button>
            
                <Button variant="outline" onclick={handleEditClick} class="w-10 h-10 !rounded-xl !p-0" title="进入编辑模式">
                    <Pencil class="w-5 h-5" />
                </Button>

                <div class="relative group/tooltip">
                    <Button variant="outline" onclick={onConfig} class="w-10 h-10 !rounded-xl !p-0">
                      <Settings class="w-5 h-5" />
                    </Button>
                    {#if !nav.config.token}
                       <div class="absolute right-0 top-full mt-2 w-max px-3 py-1.5 bg-text text-bg text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 font-medium shadow-xl translate-y-1 group-hover/tooltip:translate-y-0">配置 GitHub 以同步数据</div>
                    {/if}
                </div>
            </div>
        {/if}
      </div>
    </div>
  </header>
</div>