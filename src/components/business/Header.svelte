<script lang="ts">
  // 1. Imports
  import { app } from '$lib/store.svelte';
  import { ICONS } from '$lib/icons';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  // 2. Props / State
  let { onConfig } = $props<{ onConfig: () => void }>();
  let search = $state('');

  // 3. Derived
  const logoHref = $derived(app.isEdit ? undefined : "https://github.com/kyroli/kyroli.github.io");
  const logoWrapperClass = $derived(`flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95 group ${app.isEdit ? 'pointer-events-none' : ''}`);

  // 4. Handlers
  function handleSearch() {
    if (!search.trim()) return;
    window.open(`https://www.bing.com/search?q=${encodeURIComponent(search)}`);
    search = '';
  }

  function handleEditClick() {
      if (!app.config.token) { 
          app.showToast('请先配置 GitHub Token', 'error');
          return; 
      }
      app.toggleEdit();
  }

  // 5. Visual Constants
  const headerWrapperClass = "w-full mt-8 mb-8 relative";
  const headerInnerClass = "w-full flex flex-col md:flex-row justify-between items-center gap-5";
  
  // Logo Styles
  const logoInnerClass = "w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:rotate-6 transition-transform";
  const logoSubTextClass = "text-[10px] font-mono text-text-dim/60 tracking-widest uppercase";
  const logoTitleClass = "font-bold text-xl tracking-tight select-none text-text leading-none";

  // Search Styles
  const searchContainerClass = "relative w-full md:w-[480px]";
  const searchIconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim cursor-pointer hover:text-primary transition-colors";
  const searchInputClass = "px-11 py-3 text-base shadow-sm";

  // Action Bar Styles
  const actionBarClass = "flex gap-2 animate-fade";
  const iconBtnClass = "w-10 h-10 !rounded-xl !p-0";
  const closeBtnClass = "h-10 w-10 !rounded-xl !p-0 text-text-dim";
  const actionBtnWideClass = "h-10 w-28 !rounded-xl";
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
        {#if app.isEdit}
            <div class={actionBarClass}>
                <Button variant="ghost" onclick={() => app.toggleEdit()} class={closeBtnClass} title="退出编辑">
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.close.viewBox}>{@html ICONS.close.path}</svg>
                </Button>

                <Button variant="primary" onclick={() => app.openConfirm('确定要同步当前修改到 GitHub 吗？', () => app.sync())} class={actionBtnWideClass} title="保存并同步" disabled={!app.isDirty}>
                    <span class="mr-1">保存</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.save.viewBox}>{@html ICONS.save.path}</svg>
                </Button>

                <Button variant="danger" onclick={() => app.openConfirm('确定丢弃修改并重置吗？', () => app.reset())} class={actionBtnWideClass} title="重置">
                    <span class="mr-1">重置</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox={ICONS.reset.viewBox}>{@html ICONS.reset.path}</svg>
                </Button>
            </div>
        {:else}
           <div class={actionBarClass}>
                 <Button variant="outline" onclick={() => app.toggleTheme()} class={iconBtnClass} title="切换主题">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.theme.viewBox}>{@html ICONS.theme.path}</svg>
                </Button>
            
                <Button variant="outline" onclick={handleEditClick} class={iconBtnClass} title="进入编辑模式">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.edit.viewBox}>{@html ICONS.edit.path}</svg>
                </Button>

                <Button variant="outline" onclick={onConfig} class={iconBtnClass} title="设置">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.settings.viewBox}>{@html ICONS.settings.path}</svg>
               </Button>
            </div>
        {/if}
      </div>
    </div>
  </header>
</div>