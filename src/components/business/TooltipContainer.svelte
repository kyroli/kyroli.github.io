<script lang="ts">
import { fade } from 'svelte/transition';
import { tooltipState } from '$lib/actions/tooltip.svelte';
import { ANIMATION_SPEED } from '$lib/constants';
import { promoteToTopLayer } from '$lib/utils';
</script>

{#if tooltipState.current}
  <div
    {@attach promoteToTopLayer}
    popover="manual"
    transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }}
    class="fixed m-0 p-0 border-none outline-none bg-transparent pointer-events-none overflow-visible"
    style="
      position-anchor: {tooltipState.current.anchorName};
      position-area: block-start;
      position-try-fallbacks: flip-block;
      margin-block-end: 8px;
    "
  >
    <div class="px-3 py-1.5 bg-text text-bg text-xs rounded-lg font-bold tracking-wide shadow-float max-w-[200px] text-center text-balance leading-relaxed">
      {tooltipState.current.msg}
    </div>
  </div>
{/if}