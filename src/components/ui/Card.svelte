<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import { UI_CONSTANTS } from '$lib/constants';

type Props = HTMLAttributes<HTMLElement> & {
  children: Snippet;
  class?: string;
  onclick?: (e: MouseEvent) => void;
  href?: string;
  interactive?: boolean;
};

let {
  children,
  class: className = '',
  onclick,
  href,
  interactive = true,
  ...rest
}: Props = $props();

const role = $derived(onclick ? 'button' : undefined);

const baseStyles = `${UI_CONSTANTS.CARD_HEIGHT} p-4 flex items-center gap-4 bg-surface border rounded-xl relative`;

const finalClass = $derived([
  baseStyles,
  interactive ? 'overflow-hidden' : 'overflow-visible',
  !/\bborder-(transparent|border|primary|danger)\b/.test(className) && 'border-border',
  className
]);
</script>

{#if href}
  <a {href} {onclick} target="_blank" rel="noopener noreferrer" class={finalClass} {...rest}>
    {@render children()}
  </a>
{:else}
  <div {onclick} class={finalClass} {role} {...rest}>
    {@render children()}
  </div>
{/if}