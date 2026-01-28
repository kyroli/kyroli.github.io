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
  const baseStyles = "block bg-surface border border-border rounded-xl shadow-sm transition-transform transition-colors duration-200 select-none will-change-transform";
  const hoverStyles = "hover:border-primary/50 hover:bg-bg hover:shadow-md";
</script>

{#if href}
  <a 
    {href} 
    {onclick} 
    target="_blank" 
    rel="noopener noreferrer" 
    class="{baseStyles} {hoverStyles} {className}"
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