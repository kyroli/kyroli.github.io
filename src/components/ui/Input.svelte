<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils/cn';
  import { fade } from 'svelte/transition';
  import { ANIMATION_SPEED } from '$lib/constants';

  let { 
    value = $bindable(), 
    label,
    error,
    class: className = '',
    type = 'text',
    id,
    ...rest
  } = $props<{
    value: string;
    label?: string;
    error?: string;
    class?: string;
  } & HTMLInputAttributes>();

  const baseStyles = "w-full bg-bg border rounded-xl px-4 py-3 text-sm text-text outline-none transition-colors transition-shadow duration-200 placeholder:text-text-dim/60";
  const stateStyles = $derived(error 
    ? 'border-danger/50 focus:border-danger text-danger placeholder:text-danger/40 focus:ring-2 focus:ring-danger/20' 
    : 'border-border focus-ring'
  );

  const inputClass = $derived(cn(baseStyles, stateStyles, className));
  
  const labelClass = "text-xs font-bold text-text-dim tracking-wide ml-1 select-none";
  const errorClass = "text-[10px] font-bold text-danger ml-1";
</script>

<div class="w-full flex flex-col gap-1.5">
  {#if label}
    <label for={id} class={labelClass}>{label}</label>
  {/if}

  <input {id} {type} bind:value class={inputClass} {...rest} />

  {#if error}
    <span in:fade={{ duration: ANIMATION_SPEED.FADE_FAST }} class={errorClass}>
      {error}
    </span>
  {/if}
</div>