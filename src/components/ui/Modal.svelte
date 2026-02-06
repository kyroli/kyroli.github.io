<script lang="ts">
  import type { Snippet } from 'svelte';

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

  function handleClose() {
    onClose();
  }

  const dialogClass = `
    bg-surface text-text 
    rounded-2xl w-full max-w-sm p-8 m-auto
    border border-border 
    shadow-2xl shadow-black/20 
    outline-none
    animate-fade
    backdrop:bg-black/40 backdrop:transition-opacity
    max-h-[90vh] overflow-y-auto
  `;

  const titleClass = "text-xl font-bold tracking-tight text-text m-0";
</script>

<dialog 
  bind:this={dialog} 
  class={dialogClass}
  onclose={handleClose}
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