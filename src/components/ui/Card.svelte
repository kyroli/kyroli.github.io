<script lang="ts">
import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import { UI_CONSTANTS } from '$lib/constants';

type Props = HTMLAttributes<HTMLElement> & {
  children: Snippet;
  class?: ClassValue;
  onclick?: (e: MouseEvent) => void;
  href?: string;
  interactive?: boolean;
};

let { children, class: className, onclick, href, interactive = true, ...rest }: Props = $props();

function handleKeyDown(e: KeyboardEvent) {
  if ((e.key === 'Enter' || e.key === ' ') && e.currentTarget instanceof HTMLElement) {
    e.preventDefault();
    e.currentTarget.click();
  }
}

const baseStyles = `${UI_CONSTANTS.CARD_HEIGHT} p-4 flex items-center gap-4 bg-surface border rounded-xl relative`;

const finalClass = $derived([
  baseStyles,
  interactive ? 'overflow-hidden' : 'overflow-visible',
  (typeof className !== 'string' ||
    !/\bborder-(transparent|border|primary|danger)\b/.test(className)) &&
    'border-border',
  className
]);
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