<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { UI_CONSTANTS } from '$lib/utils';
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

  const baseLayout = `${UI_CONSTANTS.CARD_HEIGHT} p-4 flex items-center gap-4`;
</script>

{#if skeleton}
  <div class="{baseLayout} border border-transparent {className}" {...rest}>
    {@render children()}
  </div>
{:else}
  <Card class="{baseLayout} {className}" {...rest}>
    {@render children()}
  </Card>
{/if}