<script lang="ts">
  // 1. Imports
  import { app } from '$lib/store.svelte';
  import { resolveError } from '$lib/utils'; // 引入统一错误处理
  import Modal from '../ui/Modal.svelte';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';
  
  // 2. Props / State
  let { onClose } = $props<{ onClose: () => void }>();
  let repoPath = $state(app.config.owner ? `${app.config.owner}/${app.config.repo}` : '');
  let token = $state(app.config.token);
  let isSaving = $state(false);
  let errorMsg = $state('');

  // 3. Derived
  const saveBtnText = $derived(isSaving ? '正在连接...' : '保存并同步');

  // 4. Handlers
  async function handleSave() {
    errorMsg = '';
    if (!repoPath || !token) { 
      errorMsg = '请填写完整信息'; 
      return;
    }

    const parts = repoPath.split('/');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      errorMsg = '格式错误：用户名/仓库名';
      return;
    }
    
    isSaving = true;
    try {
      await app.updateConfig({ owner: parts[0].trim(), repo: parts[1].trim(), token: token.trim() });
      onClose();
      app.showToast('连接成功，配置已保存', 'success');
    } catch (e: unknown) {
      errorMsg = resolveError(e); // 使用统一翻译
    } finally {
      isSaving = false;
    }
  }

  // 5. Visual Constants
  const errorClass = "bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-600 dark:text-red-400 text-xs font-bold animate-fade";
  const labelClass = "text-xs font-bold text-text-dim tracking-wider ml-1";
  const footerClass = "mt-6 pt-5 border-t border-border/40 flex items-center justify-center text-xs text-text-dim/60";
  const actionBtnClass = "hover:text-primary transition-colors cursor-pointer";
</script>

<Modal {onClose} title="GitHub 配置">
  {#if errorMsg}
    <div class={errorClass}>⚠️ {errorMsg}</div>
  {/if}

  <div class="space-y-2">
    <label class={labelClass} for="repo">用户名 / 仓库名 (Owner/Repo)</label>
    <Input id="repo" bind:value={repoPath} placeholder="username/repo" oninput={() => errorMsg = ''} />
  </div>
  
  <div class="space-y-2">
    <label class={labelClass} for="token">个人访问令牌 (Token)</label>
    <Input id="token" bind:value={token} type="password" placeholder="ghp_..." oninput={() => errorMsg = ''} class="tracking-widest" />
  </div>
   
  <Button onclick={handleSave} disabled={isSaving} class="py-3.5 mt-2">
    {saveBtnText}
  </Button>

  <div class={footerClass}>
    <div class="flex gap-4">
      <button onclick={() => app.exportBackup()} class={actionBtnClass} title="导出 JSON 备份">导出数据</button>
      <span class="opacity-30">|</span>
      <button onclick={() => app.importBackup()} class={actionBtnClass} title="从 JSON 恢复">导入数据</button>
    </div>
  </div>
</Modal>