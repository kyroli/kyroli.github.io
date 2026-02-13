<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils/cn';

  let { children, onClose, title } = $props<{ 
    children: Snippet;
    onClose: () => void;
    title?: string;
  }>();

  let dialog = $state<HTMLDialogElement>();
  let interactStart = $state<EventTarget | null>(null);

  $effect(() => {
    if (dialog) {
      dialog.showModal();
      return () => dialog.close();
    }
  });

  function handleMousedown(e: MouseEvent) {
    interactStart = e.target;
  }

  function handleMouseup(e: MouseEvent) {
    if (interactStart === dialog && e.target === dialog) {
      dialog?.close();
    }
    interactStart = null;
  }

  const dialogStyles = cn(
    "m-auto w-full max-w-sm rounded-2xl p-8",
    "max-h-[90vh] overflow-y-auto",
    "bg-surface text-text",
    "border border-border shadow-2xl shadow-black/20",
    "outline-none",
    "animate-fade",
    "backdrop:bg-black/40 backdrop:transition-opacity backdrop:backdrop-blur-[1px]"
  );

  const titleClass = "text-xl font-bold tracking-tight text-text m-0";
</script>

<dialog 
  bind:this={dialog} 
  class={dialogStyles}
  onclose={() => onClose()}
  onmousedown={handleMousedown}
  onmouseup={handleMouseup}
>
  <div class="flex flex-col gap-6">
    {#if title}
      <h2 class={titleClass}>{title}</h2>
    {/if}
    
    {@render children()}
  </div>
</dialog>