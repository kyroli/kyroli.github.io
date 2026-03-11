<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils/cn';
  
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

  const role = $derived(onclick ? "button" : undefined);
  const baseStyles = "block bg-surface border border-border rounded-xl transition-all duration-200 will-change-transform";
  
  const finalClass = $derived(cn(baseStyles, className));
</script>

{#if href}
  <a 
    {href} 
    {onclick} 
    target="_blank" 
    rel="noopener noreferrer" 
    class={finalClass}
    {...rest}
  >
    {@render children()}
  </a>
{:else}
  <div 
    {onclick} 
    class={finalClass} 
    {role}
    {...rest}
  >
    {@render children()}
  </div>
{/if}