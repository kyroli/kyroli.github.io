<script lang="ts">
  import { nav } from '$lib/nav.svelte';
  import { ui } from '$lib/ui.svelte';
  import { Trash2 } from 'lucide-svelte';
  import Modal from '../ui/Modal.svelte';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let { groupId, siteId, onClose } = $props<{ 
    groupId: string, 
    siteId?: string, 
    onClose: () => void 
  }>();

  const group = nav.data.groups.find(g => g.id === groupId);
  const site = siteId ? group?.sites.find(s => s.id === siteId) : null;

  let name = $state(site?.name ?? '');
  let url = $state(site?.url ?? '');
  let icon = $state(site?.icon ?? '');

  const modalTitle = $derived(siteId ? '编辑站点' : '新建站点');

  function handleSave() {
    if (!name || !url) {
      ui.showToast('请填写名称和链接', 'error');
      return;
    }

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    try {
      const u = new URL(finalUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        ui.showToast('仅支持 HTTP/HTTPS 协议', 'error');
        return;
      }
    } catch {
      ui.showToast('无效的链接格式', 'error');
      return;
    }

    const newSite = { id: site?.id ?? crypto.randomUUID(), name, url: finalUrl, icon };
    nav.saveSite(groupId, newSite);
    onClose();
    ui.showToast('站点已保存', 'success');
  }

  function handleDelete() {
    if (!siteId) return;
    ui.openConfirm('确定要删除这个站点吗？', () => {
      nav.deleteSite(groupId, siteId);
      onClose();
      ui.showToast('站点已删除', 'success');
    });
  }
  
  const deleteBtnClass = "absolute top-6 right-6";
  const deleteIconBtnClass = "!p-2 !rounded-lg text-danger hover:bg-danger/10 !border-transparent";
</script>

<Modal {onClose} title={modalTitle}>
  {#if siteId}
    <div class={deleteBtnClass}>
      <Button variant="ghost" onclick={handleDelete} class={deleteIconBtnClass}>
        <Trash2 class="w-5 h-5" />
      </Button>
    </div>
  {/if}

  <div class="space-y-3">
    <Input bind:value={name} placeholder="网站名称" />
    <Input bind:value={url} placeholder="链接地址 (例如 google.com)" />
    <Input bind:value={icon} placeholder="图标文件名 (可选)" />
    
    <div class="flex gap-2 pt-4">
      <Button variant="ghost" onclick={onClose} class="flex-1 font-bold text-text-dim">取消</Button>
      <Button onclick={handleSave} class="flex-1">完成</Button>
    </div>
  </div>
</Modal>