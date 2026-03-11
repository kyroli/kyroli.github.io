<script lang="ts">
  import { appState } from '$lib/core/app.svelte';
  import { promoteToTopLayer } from '$lib/actions/popover';
  import { fade } from 'svelte/transition';
  import { ANIMATION_SPEED } from '$lib/constants';
</script>

{#if appState.tooltip && appState.tooltip.visible}
  <div
    use:promoteToTopLayer
    popover="manual"
    class="fixed m-0 p-0 border-none outline-none bg-transparent pointer-events-none z-[10000] overflow-visible"
    style="
      left: {appState.tooltip.x}px; 
      top: {appState.tooltip.y}px;
      transform: translate(-50%, {appState.tooltip.position === 'top' ? '-100%' : '0'});
    "
  >
    <div transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }} class="px-3 py-1.5 bg-text text-bg text-xs rounded-lg font-bold tracking-wide shadow-float max-w-[200px] text-center text-balance leading-relaxed">
      {appState.tooltip.msg}
    </div>
  </div>
{/if}