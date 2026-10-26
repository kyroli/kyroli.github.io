<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import { tilt } from '$lib/actions/tilt';
import { UI_CONSTANTS } from '$lib/constants';
import { cn } from '$lib/utils';

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

const baseStyles = `${UI_CONSTANTS.CARD_HEIGHT} p-4 flex items-center gap-4 bg-surface border border-border rounded-xl tilt-card`;

const finalClass = $derived(
  cn(baseStyles, interactive ? 'overflow-hidden' : 'overflow-visible', className)
);
</script>

{#if href}
  <a {href} {onclick} target="_blank" rel="noopener noreferrer" class={finalClass} {@attach tilt({ disabled: !interactive })} {...rest}>
    {@render children()}
    <div class="tilt-shine"></div>
  </a>
{:else}
  <div {onclick} class={finalClass} {role} {@attach tilt({ disabled: !interactive })} {...rest}>
    {@render children()}
    <div class="tilt-shine"></div>
  </div>
{/if}