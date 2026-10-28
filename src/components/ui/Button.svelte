<script lang="ts">
import type { Snippet } from 'svelte';
import { tooltip } from '$lib/actions/tooltip';

interface Props {
  children: Snippet;
  onclick?: (e: MouseEvent) => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'icon';
  class?: string;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
}

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
}: Props = $props();

const baseStyles =
  'flex items-center justify-center rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active-press font-bold text-sm tracking-wide border';

const variants: Record<string, string> = {
  primary: 'bg-primary text-white border-primary hover:opacity-90 shadow-xs',
  outline: 'bg-surface border-border hover:bg-bg hover:border-primary/50',
  ghost: 'bg-transparent border-transparent hover:bg-bg hover:text-primary',
  danger: 'bg-danger text-white border-danger hover:opacity-90 shadow-xs'
};

const sizes: Record<string, string> = {
  default: 'h-10 px-4',
  icon: 'h-10 w-10 shrink-0'
};

const buttonClass = $derived([
  baseStyles,
  variants[variant],
  (variant === 'outline' || variant === 'ghost') &&
    !/\btext-(text|primary|danger|white)\b/.test(className) &&
    'text-text',
  sizes[size],
  className
]);
</script>

<button 
  {type}
  class={buttonClass}
  {onclick}
  {disabled}
  {@attach tooltip(title)}
  {...rest}
>
  {@render children()}
</button>