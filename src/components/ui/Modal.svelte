<script lang="ts">
  import type { Snippet } from 'svelte';
  
  let { children, onClose, title } = $props<{ 
    children: Snippet;
    onClose: () => void;
    title?: string;
  }>();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  const overlayClass = "fixed inset-0 z-[100] flex items-center justify-center p-6";
  const backdropClass = "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity w-full h-full cursor-default";
  
  const panelClass = "relative bg-surface/90 backdrop-blur-xl rounded-2xl w-full max-w-sm p-8 animate-fade border border-border/80 flex flex-col gap-6 pointer-events-auto ring-1 ring-black/5 shadow-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";
  
  const titleClass = "text-xl font-bold tracking-tight text-text";
</script>

<svelte:window onkeydown={handleKeydown} />

<div class={overlayClass} role="presentation">
  <button type="button" class={backdropClass} onclick={onClose} aria-label="关闭弹窗"></button>
  
  <div class={panelClass} role="dialog" aria-modal="true">
    {#if title}
      <h2 class={titleClass}>{title}</h2>
    {/if}
    
    {@render children()}
  </div>
</div>