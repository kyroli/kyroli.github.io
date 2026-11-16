<script lang="ts">
import type { Snippet } from 'svelte';
import { tooltip } from '$lib/actions/tooltip.svelte';
import { ANIMATION_SPEED } from '$lib/constants';
import { MESSAGES } from '$lib/i18n';
import Icon from './Icon.svelte';

let {
  children,
  onClose,
  title
}: {
  children: Snippet;
  onClose: () => void;
  title?: string;
} = $props();

const titleId = $props.id();

function showModal(node: HTMLDialogElement) {
  if (!node.open) {
    node.showModal();
    node
      .querySelector<HTMLElement>(
        '[autofocus], [data-autofocus], input:not([type="hidden"]), textarea, select'
      )
      ?.focus();
  }
}

// Close the native dialog on unmount so CSS top-layer exit transitions can run before removal.
function modalExit(node: Element) {
  if (node instanceof HTMLDialogElement && node.open) {
    node.close();
  }
  return { duration: ANIMATION_SPEED.FADE_NORMAL };
}

const dialogStyles =
  'modal-dialog m-auto w-[calc(100%-2rem)] sm:w-full max-w-sm rounded-2xl p-6 sm:p-8 max-h-[90dvh] overflow-y-auto bg-surface text-text border border-border shadow-float outline-none backdrop:bg-black/40 backdrop:backdrop-blur-[1px]';

const titleClass = 'text-xl font-bold tracking-tight text-text m-0';
</script>

{#snippet actionButtons()}
  <div class="flex items-center gap-1 -mr-2">
    <button
      type="button"
      onclick={onClose}
      class="p-1.5 text-text-dim hover:text-text hover:bg-bg rounded-lg transition-colors cursor-pointer active-press-icon"
      {@attach tooltip(MESSAGES.UI.CANCEL)}
    >
      <Icon name="x" class="w-5 h-5" />
    </button>
  </div>
{/snippet}

<dialog
  {@attach showModal}
  closedby="any"
  aria-labelledby={title ? titleId : undefined}
  aria-label={!title ? MESSAGES.UI.CONFIRM_ACTION : undefined}
  class={dialogStyles}
  onclose={(e) => !e.currentTarget.inert && onClose()}
  out:modalExit|global
>
  <div class="flex flex-col gap-6 relative">
    {#if title}
      <div class="flex items-center justify-between">
        <h2 id={titleId} class={titleClass}>{title}</h2>
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