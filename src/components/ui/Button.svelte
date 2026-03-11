<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils/cn';
  import { tooltip } from '$lib/actions/tooltip';

  let { 
    children, 
    onclick, 
    variant = 'primary', 
    size = 'default',
    class: className = '',
    disabled = false,
    title = '',
    type = 'button',
    ...rest
  } = $props<{ 
    children: Snippet;
    onclick?: (e: MouseEvent) => void;
    variant?: 'primary' | 'outline' | 'ghost' | 'danger';
    size?: 'default' | 'icon';
    class?: string;
    disabled?: boolean;
    title?: string;
    type?: 'button' | 'submit' | 'reset';
  }>();

  // 严格限制过渡属性
  const baseStyles = "flex items-center justify-center rounded-xl transition-colors transition-transform transition-opacity duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active-press font-bold text-sm tracking-wide border";

  const variants = {
    primary: "bg-primary text-white border-primary hover:opacity-90 shadow-sm",
    outline: "bg-surface text-text border-border hover:bg-bg hover:border-primary/50",
    ghost:   "bg-transparent text-text border-transparent hover:bg-bg hover:text-primary",
    danger:  "bg-danger text-white border-danger hover:opacity-90 shadow-sm"
  };

  const sizes = {
    default: "h-10 px-4", 
    icon: "h-10 w-10 shrink-0" 
  };

  const buttonClass = $derived(cn(
    baseStyles,
    variants[variant],
    sizes[size],
    className
  ));
</script>

<button 
  {type}
  class={buttonClass}
  {onclick}
  {disabled}
  use:tooltip={title}
  {...rest}
>
  {@render children()}
</button>