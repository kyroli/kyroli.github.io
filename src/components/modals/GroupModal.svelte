<script lang="ts">
  // 1. Imports
  import { app } from '$lib/store.svelte';
  import Modal from '../ui/Modal.svelte';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  // 2. Props
  let { onClose, groupId, initialName = '' } = $props<{ 
    onClose: () => void, 
    groupId?: string, 
    initialName?: string 
  }>();

  // 3. State
  let name = $state(initialName);

  // 4. Derived
  const modalTitle = $derived(groupId ? "重命名分组" : "新建分组");

  // 5. Handlers
  function handleSave() {
    if (!name.trim()) {
        app.showToast('请输入分组名称', 'error');
        return;
    }
    
    if (groupId) {
      app.renameGroup(groupId, name.trim());
      app.showToast('分组已重命名', 'success');
    } else {
      app.addGroup(name.trim());
      app.showToast('分组已添加', 'success');
    }
    
    onClose();
  }
</script>

<Modal {onClose} title={modalTitle}>
  <div class="space-y-3">
    <Input 
      bind:value={name} 
      placeholder="分组名称" 
      onkeydown={(e) => e.key === 'Enter' && handleSave()}
    />
    
    <div class="flex gap-2 pt-4">
      <Button variant="ghost" onclick={onClose} class="flex-1 font-bold text-text-dim">取消</Button>
      <Button onclick={handleSave} class="flex-1">完成</Button>
    </div>
  </div>
</Modal>