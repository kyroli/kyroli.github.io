<script lang="ts">
import { untrack } from 'svelte';
import { fade } from 'svelte/transition';
import { ANIMATION_SPEED } from '$lib/constants';
import { appState } from '$lib/core/app.svelte';
import { dataState } from '$lib/core/data.svelte';
import { MESSAGES } from '$lib/i18n';
import { manager } from '$lib/services/manager';
import { normalizeHttpUrl } from '$lib/utils';
import Button from '../ui/Button.svelte';
import Input from '../ui/Input.svelte';
import Modal from '../ui/Modal.svelte';

let {
  groupId,
  siteId,
  onClose
}: {
  groupId: string;
  siteId?: string;
  onClose: () => void;
} = $props();

const group = $derived(dataState.groups.find((g) => g.id === groupId));
const site = $derived(siteId ? group?.sites.find((s) => s.id === siteId) : null);

const modalTitle = $derived(
  siteId ? MESSAGES.MODAL.SITE_TITLE_EDIT : MESSAGES.MODAL.SITE_TITLE_NEW
);

let name = $state(untrack(() => site?.name ?? ''));
let url = $state(untrack(() => site?.url ?? ''));
let selectedGroupId = $state(untrack(() => groupId));
let error = $state('');

function handleSave() {
  error = '';
  if (!group || (siteId && !site)) {
    onClose();
    return;
  }

  if (
    site &&
    name.trim() === site.name &&
    normalizeHttpUrl(url) === site.url &&
    selectedGroupId === groupId
  ) {
    onClose();
    return;
  }

  try {
    manager.saveSite(groupId, {
      id: siteId,
      name,
      url,
      targetGroupId: selectedGroupId
    });

    appState.showToast(MESSAGES.TOAST.SITE_SAVED, 'success');
    onClose();
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : MESSAGES.TOAST.SITE_URL_ERROR;
  }
}

const errorBannerClass =
  'bg-danger/10 border border-danger/20 rounded-xl p-3 text-danger text-xs font-bold';
</script>

<Modal {onClose} title={modalTitle}>
  {#if error}
    <div role="alert" transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }} class={errorBannerClass}>{error}</div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-4">
    <Input
      label={MESSAGES.MODAL.SITE_LABEL_NAME}
      bind:value={name}
      placeholder={MESSAGES.MODAL.SITE_NAME_PLACEHOLDER}
      oninput={() => (error = '')}
      required
    />
    <Input
      label={MESSAGES.MODAL.SITE_LABEL_URL}
      bind:value={url}
      placeholder={MESSAGES.MODAL.SITE_URL_PLACEHOLDER}
      oninput={() => (error = '')}
      required
    />

    {#if dataState.groups.length > 1}
      <div class="w-full flex flex-col gap-1.5">
        <label for="site-group-select" class="text-xs font-bold text-text-dim tracking-wide ml-1 select-none">
          {MESSAGES.MODAL.SITE_LABEL_GROUP}
        </label>
        <select
          id="site-group-select"
          bind:value={selectedGroupId}
          class="base-select w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-bold text-text outline-none transition duration-200 focus-ring cursor-pointer"
        >
          {#each dataState.groups as g (g.id)}
            <option value={g.id}>{g.name}</option>
          {/each}
        </select>
      </div>
    {/if}
    
    <div class="flex gap-3 pt-2">
      <Button variant="ghost" type="button" onclick={onClose} class="flex-1 text-text-dim">
        {MESSAGES.UI.CANCEL}
      </Button>
      <Button type="submit" class="flex-1">
        {MESSAGES.UI.COMPLETE}
      </Button>
    </div>
  </form>
</Modal>
