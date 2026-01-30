<script lang="ts">
  import { nav } from '$lib/nav.svelte';
  import { ui } from '$lib/ui.svelte';
  import { MESSAGES } from '$lib/i18n';
  import Modal from '../ui/Modal.svelte';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let { onClose, groupId } = $props<{ 
    onClose: () => void, 
    groupId?: string 
  }>();

  const group = groupId ? nav.data.groups.find(g => g.id === groupId) : null;
  
  let name = $state(group?.name ?? '');

  const modalTitle = $derived(groupId ? MESSAGES.MODAL.GROUP_TITLE_EDIT : MESSAGES.MODAL.GROUP_TITLE_NEW);

  function handleSave() {
    if (!name.trim()) {
        ui.showToast(MESSAGES.TOAST.GROUP_NAME_REQUIRED, 'error');
        return;
    }
    
    if (groupId) {
      nav.renameGroup(groupId, name.trim());
      ui.showToast(MESSAGES.TOAST.GROUP_RENAMED, 'success');
    } else {
      nav.addGroup(name.trim());
      ui.showToast(MESSAGES.TOAST.GROUP_ADDED, 'success');
    }
    
    onClose();
  }
</script>

<Modal {onClose} title={modalTitle}>
  <div class="space-y-3">
    <Input 
      bind:value={name} 
      placeholder={MESSAGES.MODAL.GROUP_PLACEHOLDER}
      onkeydown={(e) => e.key === 'Enter' && handleSave()}
    />
    
    <div class="flex gap-2 pt-4">
      <Button variant="ghost" onclick={onClose} class="flex-1 font-bold text-text-dim">{MESSAGES.UI.CANCEL}</Button>
      <Button onclick={handleSave} class="flex-1">{MESSAGES.UI.COMPLETE}</Button>
    </div>
  </div>
</Modal>