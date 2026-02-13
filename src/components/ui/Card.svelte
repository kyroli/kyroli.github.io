<script lang="ts">
  import type { Snippet } from 'svelte';
  let { 
    children, 
    class: className = '',
    onclick,
    href
  } = $props<{ 
    children: Snippet;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    href?: string;
  }>();

  const role = $derived(onclick ? "button" : undefined);
  const baseStyles = "block bg-surface border border-border rounded-xl transition-all duration-200 will-change-transform";
</script>

{#if href}
  <a 
    {href} 
    {onclick} 
    target="_blank" 
    rel="noopener noreferrer" 
    class="{baseStyles} {className}"
  >
    {@render children()}
  </a>
{:else}
  <div 
    {onclick} 
    class="{baseStyles} {className}" 
    {role}
  >
    {@render children()}
  </div>
{/if}