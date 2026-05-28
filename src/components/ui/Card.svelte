<script lang="ts">
import type { Snippet } from 'svelte';
import { cn } from '$lib/utils/cn';
import { tilt } from '$lib/actions/tilt.svelte';
import { appState } from '$lib/core/app.svelte';

let {
  children,
  class: className = '',
  onclick,
  href,
  ...rest
} = $props<{
  children: Snippet;
  class?: string;
  onclick?: (e: MouseEvent) => void;
  href?: string;
}>();

const role = $derived(onclick ? 'button' : undefined);

const baseStyles =
  'block bg-surface border border-border rounded-xl transition-colors transition-shadow tilt-card';

const finalClass = $derived(
  cn(baseStyles, appState.isEditMode ? 'overflow-visible' : 'overflow-hidden', className)
);
</script>

{#if href}
  <a {href} {onclick} target="_blank" rel="noopener noreferrer" class={finalClass} use:tilt={() => ({ disabled: appState.isEditMode })} {...rest}>
    {@render children()}
    <div class="tilt-shine"></div>
  </a>
{:else}
  <div {onclick} class={finalClass} {role} use:tilt={() => ({ disabled: appState.isEditMode })} {...rest}>
    {@render children()}
    <div class="tilt-shine"></div>
  </div>
{/if}