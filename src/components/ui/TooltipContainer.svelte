<script lang="ts">
import { fade } from 'svelte/transition';
import { promoteToTopLayer } from '$lib/actions/popover';
import { ANIMATION_SPEED } from '$lib/constants';
import { appState } from '$lib/core/app.svelte';
</script>

{#if appState.tooltip && appState.tooltip.visible}
  <div
    {@attach promoteToTopLayer}
    popover="manual"
    class="fixed m-0 p-0 border-none outline-none bg-transparent pointer-events-none z-[10000] overflow-visible"
    style="
      position-anchor: {appState.tooltip.anchorName};
      position-area: top;
      position-try-fallbacks: flip-block;
      margin-bottom: 8px;
    "
  >
    <div transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }} class="px-3 py-1.5 bg-text text-bg text-xs rounded-lg font-bold tracking-wide shadow-float max-w-[200px] text-center text-balance leading-relaxed">
      {appState.tooltip.msg}
    </div>
  </div>
{/if}