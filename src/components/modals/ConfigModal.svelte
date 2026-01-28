<script lang="ts">
  // 1. Imports
  import { app } from '$lib/store.svelte';
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
  const ERROR_MAP: Record<string, string> = {
    'REPO_NOT_FOUND': '找不到该仓库，请检查“用户名/仓库名”',
    'TOKEN_INVALID': 'Token 无效或已过期',
    'HTTP_ERROR_403': 'API 调用超限或无权限',
    'Failed to fetch': '网络连接失败',
  };

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
      const err = e as Error;
      const code = err.message || 'UNKNOWN';
      errorMsg = `${ERROR_MAP[code] || '未知错误'} (${code})`;
    } finally {
      isSaving = false;
    }
  }

  // 5. Visual Constants
  const errorClass = "bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-600 dark:text-red-400 text-xs font-bold animate-fade";
  const labelClass = "text-xs font-bold text-text-dim tracking-wider ml-1";
  const footerClass = "mt-6 pt-5 border-t border-border/40 flex items-center justify-between text-xs text-text-dim/60";
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
    <span class="font-mono tracking-wider opacity-70">DATA BACKUP</span>
    <div class="flex gap-4">
      <button onclick={() => app.exportBackup()} class={actionBtnClass} title="导出 JSON 备份">导出</button>
      <span class="opacity-30">|</span>
      <button onclick={() => app.importBackup()} class={actionBtnClass} title="从 JSON 恢复">导入</button>
    </div>
  </div>
</Modal>