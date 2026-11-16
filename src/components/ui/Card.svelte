<script lang="ts">
import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import { UI_CONSTANTS } from '$lib/constants';

type Props = HTMLAttributes<HTMLElement> & {
  children: Snippet;
  class?: ClassValue;
  onclick?: (e: MouseEvent) => void;
  href?: string;
};

let { children, class: className, onclick, href, ...rest }: Props = $props();

function handleKeyDown(e: KeyboardEvent) {
  if ((e.key === 'Enter' || e.key === ' ') && e.currentTarget instanceof HTMLElement) {
    e.preventDefault();
    e.currentTarget.click();
  }
}

const baseStyles = `card ${UI_CONSTANTS.CARD_HEIGHT} p-4 flex items-center gap-4 border rounded-xl relative overflow-hidden`;

const finalClass = $derived([baseStyles, className]);
</script>

{#if href}
  <a {href} {onclick} target="_blank" rel="noopener noreferrer" class={finalClass} {...rest}>
    {@render children()}
  </a>
{:else if onclick}
  <!-- biome-ignore lint/a11y/useSemanticElements: draggable card container cannot use a native button -->
  <div
    role="button"
    tabindex="0"
    {onclick}
    onkeydown={handleKeyDown}
    class={finalClass}
    {...rest}
  >
    {@render children()}
  </div>
{:else}
  <div class={finalClass} {...rest}>
    {@render children()}
  </div>
{/if}

<style>
@layer components {
  .card {
    background-color: var(--color-surface);
    border-color: var(--color-border);
  }
}
</style>