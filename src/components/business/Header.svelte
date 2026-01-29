<script lang="ts">
  import { nav } from '$lib/nav.svelte';
  import { ui } from '$lib/ui.svelte';
  import { ICONS } from '$lib/icons';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let { onConfig } = $props<{ onConfig: () => void }>();
  let search = $state('');

  const logoHref = $derived(ui.isEdit ? undefined : "https://github.com/kyroli/kyroli.github.io");
  const logoWrapperClass = $derived(`flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95 group ${ui.isEdit ? 'pointer-events-none' : ''}`);

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

  const headerWrapperClass = "w-full mt-8 mb-8 relative";
  const headerInnerClass = "w-full flex flex-col md:flex-row justify-between items-center gap-5";
  const logoInnerClass = "w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:rotate-6 transition-transform";
  const logoSubTextClass = "text-[10px] font-mono text-text-dim/60 tracking-widest uppercase";
  const logoTitleClass = "font-bold text-xl tracking-tight select-none text-text leading-none";
  const searchContainerClass = "relative w-full md:w-[480px]";
  const searchIconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim cursor-pointer hover:text-primary transition-colors";
  const searchInputClass = "px-11 py-3 text-base shadow-sm bg-surface/50 backdrop-blur-sm";
  const actionBarClass = "flex gap-2 animate-fade";
  const iconBtnClass = "w-10 h-10 !rounded-xl !p-0";
  const closeBtnClass = "h-10 w-10 !rounded-xl !p-0 text-text-dim";
  const actionBtnWideClass = "h-10 w-28 !rounded-xl";
  const tooltipWrapperClass = "relative group/tooltip";
  const tooltipContentClass = "absolute right-0 top-full mt-2 w-max px-3 py-1.5 bg-text text-bg text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 font-medium shadow-xl translate-y-1 group-hover/tooltip:translate-y-0";
</script>

<div class={headerWrapperClass}>
  <header class={headerInnerClass}>
    <a href={logoHref} target="_blank" class={logoWrapperClass}>
      <div class={logoInnerClass}>N</div>
      <div class="flex flex-col">
        <h1 class={logoTitleClass}>NAV-ZERO</h1>
        <span class={logoSubTextClass}>Personal Startpage</span>
      </div>
    </a>
    
    <div class={searchContainerClass}>
      <Input 
        bind:value={search}
        onkeydown={e => e.key === 'Enter' && handleSearch()}
        class={searchInputClass}
        placeholder="Search..."
      />
      <svg onclick={handleSearch} class={searchIconClass} fill="none" stroke="currentColor" viewBox={ICONS.search.viewBox}>
        {@html ICONS.search.path}
      </svg>
    </div>

    <div class="flex flex-col items-end">
      <div class="flex items-center gap-2 h-10">
        {#if ui.isEdit}
            <div class={actionBarClass}>
                <Button variant="ghost" onclick={() => ui.toggleEdit()} class={closeBtnClass} title="退出编辑">
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.close.viewBox}>{@html ICONS.close.path}</svg>
                </Button>

                <Button variant="primary" onclick={() => ui.openConfirm('确定要同步当前修改到 GitHub 吗？', () => nav.sync())} class={actionBtnWideClass} title="保存并同步" disabled={!nav.isDirty}>
                    <span class="mr-1">保存</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.save.viewBox}>{@html ICONS.save.path}</svg>
                </Button>

                <Button variant="danger" onclick={() => ui.openConfirm('确定丢弃修改并重置吗？', () => nav.reset())} class={actionBtnWideClass} title="重置">
                    <span class="mr-1">重置</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox={ICONS.reset.viewBox}>{@html ICONS.reset.path}</svg>
                </Button>
            </div>
        {:else}
           <div class={actionBarClass}>
                 <Button variant="outline" onclick={() => ui.toggleTheme()} class={iconBtnClass} title="切换主题">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.theme.viewBox}>{@html ICONS.theme.path}</svg>
                </Button>
            
                <Button variant="outline" onclick={handleEditClick} class={iconBtnClass} title="进入编辑模式">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.edit.viewBox}>{@html ICONS.edit.path}</svg>
                </Button>

                <div class={tooltipWrapperClass}>
                    <Button variant="outline" onclick={onConfig} class={iconBtnClass}>
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.settings.viewBox}>{@html ICONS.settings.path}</svg>
                    </Button>
                   {#if !nav.config.token}
                       <div class={tooltipContentClass}>配置 GitHub 以同步数据</div>
                    {/if}
                </div>
            </div>
        {/if}
      </div>
    </div>
  </header>
</div>