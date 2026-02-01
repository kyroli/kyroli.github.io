<script lang="ts">
  import type { Snippet } from 'svelte';
  let { 
    children, 
    onclick, 
    variant = 'primary', 
    size = 'default',
    class: className = '',
    disabled = false,
    title = '',
    type = 'button'
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

  const baseStyles = "flex items-center justify-center rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] font-bold text-sm tracking-wide";
  
  const variantStyles = {
    primary: "bg-primary text-white hover:opacity-90 shadow-sm border border-primary",
    outline: "border border-border bg-surface text-text hover:bg-bg hover:border-primary/50",
    ghost:   "text-text hover:bg-bg border border-transparent hover:text-primary",
    danger:  "bg-danger text-white border border-danger hover:opacity-90 shadow-sm"
  };

  const sizeStyles = {
    default: "h-10 px-4", 
    icon: "h-10 w-10 shrink-0" 
  };
</script>

<button 
  {type}
  class="{baseStyles} {variantStyles[variant]} {sizeStyles[size]} {className}"
  {onclick}
  {disabled}
  {title}
>
  {@render children()}
</button>