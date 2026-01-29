<script lang="ts">
  import type { Snippet } from 'svelte';
  import Card from '../ui/Card.svelte';

  let { 
    children, 
    class: className = '', 
    skeleton = false,
    ...rest 
  } = $props<{
    children: Snippet;
    class?: string;
    skeleton?: boolean;
    [key: string]: any;
  }>();

  const baseLayout = "h-[72px] p-4 flex items-center gap-4 bg-surface rounded-xl";
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