<script lang="ts">
import { X } from '@lucide/svelte';
import type { Snippet } from 'svelte';
import { type FadeParams, fade } from 'svelte/transition';
import { tooltip } from '$lib/actions/tooltip';
import { ANIMATION_SPEED } from '$lib/constants';
import { MESSAGES } from '$lib/i18n';
import { cn } from '$lib/utils';

let { children, onClose, title } = $props<{
  children: Snippet;
  onClose: () => void;
  title?: string;
}>();

let dialog = $state<HTMLDialogElement>();

$effect(() => {
  if (dialog) {
    dialog.showModal();
    return () => dialog?.close();
  }
});

function modalFade(node: Element, params?: FadeParams) {
  if (node instanceof HTMLDialogElement && node.open) {
    node.close();
  }
  return fade(node, params);
}

const dialogStyles = cn(
  'modal-dialog',
  'm-auto w-[calc(100%-2rem)] sm:w-full max-w-sm rounded-2xl p-6 sm:p-8',
  'max-h-[90vh] overflow-y-auto',
  'bg-surface text-text',
  'border border-border shadow-float',
  'outline-none',
  'backdrop:bg-black/40 backdrop:backdrop-blur-[1px]'
);

const titleClass = 'text-xl font-bold tracking-tight text-text m-0';
</script>

{#snippet actionButtons()}
  <div class="flex items-center gap-1 -mr-2">
    <button
      type="button"
      onclick={() => dialog?.close()}
      class="p-1.5 text-text-dim hover:text-text hover:bg-surface rounded-lg transition-colors cursor-pointer active-press-icon"
      {@attach tooltip(MESSAGES.UI.CANCEL)}
    >
      <X class="w-5 h-5" />
    </button>
  </div>
{/snippet}

<dialog
  bind:this={dialog}
  closedby="any"
  class={dialogStyles}
  onclose={() => onClose()}
  in:fade={{ duration: ANIMATION_SPEED.FADE_NORMAL }}
  out:modalFade={{ duration: ANIMATION_SPEED.FADE_NORMAL }}
>
  <div class="flex flex-col gap-6 relative">
    {#if title}
      <div class="flex items-center justify-between">
        <h2 class={titleClass}>{title}</h2>
        {@render actionButtons()}
      </div>
    {:else}
      <div class="absolute top-0 right-0 z-10 -mt-2">
        {@render actionButtons()}
      </div>
    {/if}
    
    {@render children()}
  </div>
</dialog>