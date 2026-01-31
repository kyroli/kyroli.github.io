<script lang="ts">
  import type { Snippet } from 'svelte';
  
  let { children, onClose, title } = $props<{ 
    children: Snippet;
    onClose: () => void;
    title?: string;
  }>();

  let dialog = $state<HTMLDialogElement>();

  $effect(() => {
    if (dialog) {
      dialog.showModal();
      return () => dialog.close();
    }
  });

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) {
      dialog.close();
    }
  }

  const dialogClass = `
    bg-surface/90 backdrop-blur-xl text-text 
    rounded-2xl w-full max-w-sm p-8 m-auto
    border border-border/80 
    shadow-2xl shadow-black/20 
    outline-none
    animate-fade
    backdrop:bg-black/40 backdrop:backdrop-blur-[2px] backdrop:transition-opacity
    max-h-[90vh] overflow-y-auto
  `;

  const titleClass = "text-xl font-bold tracking-tight text-text m-0";
</script>

<dialog 
  bind:this={dialog} 
  class={dialogClass}
  onclose={onClose} 
  onclick={handleBackdropClick}
>
  <div class="flex flex-col gap-6">
    {#if title}
      <h2 class={titleClass}>{title}</h2>
    {/if}
    
    {@render children()}
  </div>
</dialog>