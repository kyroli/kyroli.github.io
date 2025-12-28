<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils/cn';
  import { X } from 'lucide-svelte';
  import { tooltip } from '$lib/actions/tooltip';
  import { MESSAGES } from '$lib/i18n';
  import { fade } from 'svelte/transition';
  import { ANIMATION_SPEED } from '$lib/constants';

  let { 
    children, 
    onClose, 
    title,
    headerExtra 
  } = $props<{ 
    children: Snippet;
    onClose: () => void;
    title?: string;
    headerExtra?: Snippet;
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
    "m-auto w-[calc(100%-2rem)] sm:w-full max-w-sm rounded-2xl p-6 sm:p-8",
    "max-h-[90vh] overflow-y-auto",
    "bg-surface text-text",
    "border border-border shadow-2xl shadow-black/20",
    "outline-none",
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
  transition:fade={{ duration: ANIMATION_SPEED.FADE_NORMAL }}
>
  <div class="flex flex-col gap-6 relative">
    {#if title}
      <div class="flex items-center justify-between">
        <h2 class={titleClass}>{title}</h2>
        <div class="flex items-center gap-1 -mr-2">
          {#if headerExtra}
            {@render headerExtra()}
          {/if}
          <button 
            onclick={() => dialog?.close()}
            class="p-1.5 text-text-dim hover:text-text hover:bg-surface rounded-lg transition-colors cursor-pointer active-press-icon"
            use:tooltip={MESSAGES.UI.CANCEL}
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>
    {:else}
      <div class="absolute top-0 right-0 flex items-center gap-1 -mt-2 -mr-2 z-10">
        {#if headerExtra}
          {@render headerExtra()}
        {/if}
        <button 
          onclick={() => dialog?.close()}
          class="p-1.5 text-text-dim hover:text-text hover:bg-surface rounded-lg transition-colors cursor-pointer active-press-icon"
          use:tooltip={MESSAGES.UI.CANCEL}
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    {/if}
    
    {@render children()}
  </div>
</dialog>