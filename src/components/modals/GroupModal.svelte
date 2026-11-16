<script lang="ts">
import { untrack } from 'svelte';
import { appState } from '$lib/core/app.svelte';
import { dataState } from '$lib/core/data.svelte';
import { MESSAGES } from '$lib/i18n';
import { manager } from '$lib/services/manager';
import Button from '../ui/Button.svelte';
import Input from '../ui/Input.svelte';
import Modal from '../ui/Modal.svelte';

let {
  onClose,
  groupId
}: {
  onClose: () => void;
  groupId?: string;
} = $props();

const group = $derived(groupId ? dataState.groups.find((g) => g.id === groupId) : null);
const modalTitle = $derived(
  groupId ? MESSAGES.MODAL.GROUP_TITLE_EDIT : MESSAGES.MODAL.GROUP_TITLE_NEW
);

let name = $state(untrack(() => group?.name ?? ''));
let error = $state('');

function handleSave() {
  error = '';
  if (groupId && !group) {
    onClose();
    return;
  }

  if (group && name.trim() === group.name) {
    onClose();
    return;
  }

  try {
    if (groupId) {
      manager.renameGroup(groupId, name);
      appState.showToast(MESSAGES.TOAST.GROUP_RENAMED, 'success');
    } else {
      manager.addGroup(name);
      appState.showToast(MESSAGES.TOAST.GROUP_ADDED, 'success');
    }
    onClose();
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : MESSAGES.TOAST.UNKNOWN_ERROR;
  }
}
</script>

<Modal {onClose} title={modalTitle}>
  <form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-4">
    <Input
      bind:value={name}
      error={error}
      placeholder={MESSAGES.MODAL.GROUP_PLACEHOLDER}
      oninput={() => error = ''}
      required
    />
    
    <div class="flex gap-3 pt-2">
      <Button variant="ghost" type="button" onclick={onClose} class="flex-1 text-text-dim">{MESSAGES.UI.CANCEL}</Button>
      <Button type="submit" class="flex-1">{MESSAGES.UI.COMPLETE}</Button>
    </div>
  </form>
</Modal>