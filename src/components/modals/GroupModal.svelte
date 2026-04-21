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

  const group = groupId ? dataState.groups.find(g => g.id === groupId) : null;
  const modalTitle = groupId ? MESSAGES.MODAL.GROUP_TITLE_EDIT : MESSAGES.MODAL.GROUP_TITLE_NEW;

  let name = $state(group?.name ?? '');
  let error = $state('');

  function handleSave() {
    error = '';
    const trimmedName = name.trim();

    if (!trimmedName) {
      error = MESSAGES.TOAST.GROUP_NAME_REQUIRED;
      return;
    }

    if (groupId && group) {
      if (trimmedName === group.name) {
        onClose();
        return;
      }
    }

    try {
      if (groupId) {
        manager.renameGroup(groupId, trimmedName);
        appState.showToast(MESSAGES.TOAST.GROUP_RENAMED, 'success');
      } else {
        manager.addGroup(trimmedName);
        appState.showToast(MESSAGES.TOAST.GROUP_ADDED, 'success');
      }
      onClose();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : MESSAGES.TOAST.UNKNOWN_ERROR;
    }
  }
</script>

<Modal {onClose} title={modalTitle}>
  <form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-3">
    <Input 
      bind:value={name} 
      error={error}
      placeholder={MESSAGES.MODAL.GROUP_PLACEHOLDER}
      oninput={() => error = ''}
      required
      autofocus
    />
    
    <div class="flex gap-2 pt-4">
      <Button variant="ghost" type="button" onclick={onClose} class="flex-1 font-bold text-text-dim">{MESSAGES.UI.CANCEL}</Button>
      <Button type="submit" class="flex-1">{MESSAGES.UI.COMPLETE}</Button>
    </div>
  </form>
</Modal>