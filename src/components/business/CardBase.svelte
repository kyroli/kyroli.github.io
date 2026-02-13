<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { UI_CONSTANTS } from '$lib/utils';
  import { cn } from '$lib/utils/cn';
  import Card from '../ui/Card.svelte';

  let { 
    children, 
    class: className = '', 
    skeleton = false,
    ...rest 
  } = $props<HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
    skeleton?: boolean;
  }>();

  const baseLayout = cn(UI_CONSTANTS.CARD_HEIGHT, "p-4 flex items-center gap-4", className);
</script>

{#if skeleton}
  <div class={cn(baseLayout, "border border-transparent")} {...rest}>
    {@render children()}
  </div>
{:else}
  <Card class={baseLayout} {...rest}>
    {@render children()}
  </Card>
{/if}