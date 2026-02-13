<script lang="ts">
  let { 
    value = $bindable(), 
    placeholder = '', 
    class: className = '',
    type = 'text',
    id = '',
    oninput,
    onkeydown
  } = $props<{
    value: string;
    placeholder?: string;
    class?: string;
    type?: string;
    id?: string;
    oninput?: (e: Event) => void;
    onkeydown?: (e: KeyboardEvent) => void;
  }>();
  const inputClass = "w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary/50 transition-all placeholder:text-text-dim/30";
</script>

<input 
  {id}
  {type}
  bind:value 
  {oninput}
  {onkeydown}
  {placeholder}
  class="{inputClass} {className}"
/>