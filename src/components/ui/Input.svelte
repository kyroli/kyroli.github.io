<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

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

  const containerClass = "w-full flex flex-col gap-1.5";
  
  const labelClass = "text-xs font-bold text-text-dim tracking-wider ml-1 select-none";
  
  const inputClass = $derived(`
    w-full bg-bg border rounded-xl px-4 py-3 text-sm text-text outline-none transition-all placeholder:text-text-dim/30
    ${error 
      ? 'border-danger/50 focus:border-danger text-danger placeholder:text-danger/40' 
      : 'border-border focus:border-primary/50'
    }
    ${className}
  `);

  const errorClass = "text-[10px] font-bold text-danger ml-1 animate-fade";
</script>

<div class={containerClass}>
  {#if label}
    <label for={id} class={labelClass}>
      {label}
    </label>
  {/if}

  <input 
    {id}
    {type}
    bind:value 
    class={inputClass}
    {...rest}
  />

  {#if error}
    <span class={errorClass}>
      {error}
    </span>
  {/if}
</div>