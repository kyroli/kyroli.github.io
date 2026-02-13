<script lang="ts">
  import { dataState } from '$lib/core/data.svelte';
  import { appState } from '$lib/core/app.svelte';
  import { manager } from '$lib/services/manager';
  import { MESSAGES } from '$lib/i18n';
  import Modal from '../ui/Modal.svelte';
  import Input from '../ui/Input.svelte';
  import Button from '../ui/Button.svelte';

  let { onClose, groupId } = $props<{ 
    onClose: () => void, 
    groupId?: string 
  }>();

  const group = $derived(groupId ? dataState.groups.find(g => g.id === groupId) : null);
  
  let name = $state(group?.name ?? '');
  let error = $state('');

  const modalTitle = $derived(groupId ? MESSAGES.MODAL.GROUP_TITLE_EDIT : MESSAGES.MODAL.GROUP_TITLE_NEW);

  $effect(() => {
    if (group) {
        name = group.name;
    } else if (!groupId) {
        name = '';
    }
  });

  function handleSave() {
    error = '';
    try {
      if (groupId) {
        manager.renameGroup(groupId, name);
        appState.showToast(MESSAGES.TOAST.GROUP_RENAMED, 'success');
      } else {
        manager.addGroup(name);
        appState.showToast(MESSAGES.TOAST.GROUP_ADDED, 'success');
      }
      onClose();
    } catch (e: any) {
      error = e.message;
    }
  }
</script>

<Modal {onClose} title={modalTitle}>
  <div class="space-y-3">
    <Input 
      bind:value={name} 
      error={error}
      placeholder={MESSAGES.MODAL.GROUP_PLACEHOLDER}
      oninput={() => error = ''}
      onkeydown={(e) => e.key === 'Enter' && handleSave()}
      autofocus
    />
    
    <div class="flex gap-2 pt-4">
      <Button variant="ghost" onclick={onClose} class="flex-1 font-bold text-text-dim">{MESSAGES.UI.CANCEL}</Button>
      <Button onclick={handleSave} class="flex-1">{MESSAGES.UI.COMPLETE}</Button>
    </div>
  </div>
</Modal>