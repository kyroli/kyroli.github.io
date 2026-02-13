<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { appState } from '$lib/core/app.svelte';
  import { MESSAGES } from '$lib/i18n';

  async function handleToggle(e: MouseEvent) {
    const x = e.clientX;
    const y = e.clientY;

    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    ) + 20;

    if (!document.startViewTransition) {
      await appState.toggleTheme();
      return;
    }

    const transition = document.startViewTransition(async () => {
      await appState.toggleTheme();
    });

    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 500,
        easing: 'ease-out',
        pseudoElement: '::view-transition-new(root)'
      }
    );
  }
</script>

<button 
  type="button" 
  role="switch" 
  aria-checked={appState.isDark}
  onclick={handleToggle}
  title={MESSAGES.UI.TIP_SWITCH_THEME}
  class="relative shrink-0 w-16 h-10 rounded-full border border-border cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 overflow-hidden bg-icon-bg hover:border-primary/30"
>
  <span 
    class={`absolute top-1/2 -translate-y-1/2 left-1 h-8 w-8 rounded-full bg-surface shadow-sm border border-black/5 dark:border-white/5 flex items-center justify-center transition-all duration-300 ${
      appState.isDark ? 'left-[calc(100%-2.25rem)]' : 'left-1'
    }`}
  >
    {#if appState.isDark}
      <Moon class="w-5 h-5 text-primary" />
    {:else}
      <Sun class="w-5 h-5 text-text-dim group-hover:text-primary" />
    {/if}
  </span>
</button>

<style>
  :global(::view-transition-group(root)),
  :global(::view-transition-old(root)),
  :global(::view-transition-new(root)) {
    animation: none !important;
    mix-blend-mode: normal !important;
  }

  :global(::view-transition-old(root)) {
    z-index: 1;
    pointer-events: none;
  }

  :global(::view-transition-new(root)) {
    z-index: 9999;
    pointer-events: none;
    will-change: clip-path;
  }
</style>