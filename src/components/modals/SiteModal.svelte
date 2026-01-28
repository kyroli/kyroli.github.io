<script lang="ts">
  // 1. Imports
  import { app } from '$lib/store.svelte';
  import { ICONS } from '$lib/icons';
  import Modal from '../ui/Modal.svelte';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  // 2. Props
  let { groupId, siteId, onClose } = $props<{ 
    groupId: string, 
    siteId?: string, 
    onClose: () => void 
  }>();

  // 3. State
  const group = app.data.groups.find(g => g.id === groupId);
  const site = siteId ? group?.sites.find(s => s.id === siteId) : null;

  let name = $state(site?.name ?? '');
  let url = $state(site?.url ?? '');
  let icon = $state(site?.icon ?? '');

  // 4. Derived
  const modalTitle = $derived(siteId ? '编辑站点' : '新建站点');

  // 5. Handlers
  function handleSave() {
    if (!name || !url) {
      app.showToast('请填写名称和链接', 'error');
      return;
    }

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    if (/^(javascript|vbscript|data):/i.test(finalUrl)) {
      app.showToast('禁止使用不安全的协议', 'error');
      return;
    }

    try {
      const u = new URL(finalUrl);
      if (!u.hostname.includes('.') && u.hostname !== 'localhost') throw new Error();
    } catch {
      app.showToast('链接格式不正确', 'error');
      return;
    }

    const newSite = { id: site?.id ?? crypto.randomUUID(), name, url: finalUrl, icon };
    app.saveSite(groupId, newSite);
    onClose();
    app.showToast('站点已保存', 'success');
  }

  function handleDelete() {
    if (!siteId) return;
    app.openConfirm('确定要删除这个站点吗？', () => {
      app.deleteSite(groupId, siteId);
      onClose();
      app.showToast('站点已删除', 'success');
    });
  }
  
  // 6. Visual Constants
  const deleteBtnClass = "absolute top-6 right-6";
  const deleteIconBtnClass = "!p-2 !rounded-lg text-danger hover:bg-danger/10 !border-transparent";
  const btnGroupClass = "flex gap-2 pt-4";
</script>

<Modal {onClose} title={modalTitle}>
  {#if siteId}
    <div class={deleteBtnClass}>
      <Button variant="ghost" onclick={handleDelete} class={deleteIconBtnClass}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={ICONS.delete.viewBox}>{@html ICONS.delete.path}</svg>
      </Button>
    </div>
  {/if}

  <div class="space-y-3">
    <Input bind:value={name} placeholder="网站名称" />
    <Input bind:value={url} placeholder="链接地址 (URL)" />
    <Input bind:value={icon} placeholder="图标文件名 (可选)" />
    
    <div class={btnGroupClass}>
      <Button variant="ghost" onclick={onClose} class="flex-1 font-bold text-text-dim">取消</Button>
      <Button onclick={handleSave} class="flex-1">完成</Button>
    </div>
  </div>
</Modal>