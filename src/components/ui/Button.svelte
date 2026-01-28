<script lang="ts">
  import type { Snippet } from 'svelte';
  
  let { 
    children, 
    onclick, 
    variant = 'primary', 
    class: className = '',
    disabled = false,
    title = '',
    type = 'button'
  } = $props<{ 
    children: Snippet;
    onclick?: (e: MouseEvent) => void;
    variant?: 'primary' | 'outline' | 'ghost' | 'danger';
    class?: string;
    disabled?: boolean;
    title?: string;
    type?: 'button' | 'submit' | 'reset';
  }>();

  const baseStyles = "flex items-center justify-center rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] py-3 px-5 font-bold text-sm tracking-wide";
  
  const variantStyles = {
    primary: "bg-primary text-white hover:opacity-90 shadow-sm border border-primary",
    outline: "border border-border bg-surface text-text hover:bg-bg hover:border-primary/50",
    ghost:   "text-text hover:bg-bg border border-transparent hover:text-primary",
    danger:  "bg-danger text-white border border-danger hover:opacity-90 shadow-sm"
  };
</script>

<button 
  {type}
  class="{baseStyles} {variantStyles[variant]} {className}"
  {onclick}
  {disabled}
  {title}
>
  {@render children()}
</button>