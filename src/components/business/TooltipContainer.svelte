<script lang="ts">
import { fade } from 'svelte/transition';
import { tooltipState } from '$lib/actions/tooltip.svelte';
import { ANIMATION_SPEED } from '$lib/constants';
import { promoteToTopLayer } from '$lib/utils';
</script>

{#if tooltipState.current}
  {#key tooltipState.current.anchorName}
    <div
      role="tooltip"
      {@attach promoteToTopLayer}
      popover="hint"
      ontoggle={(e) => {
        if (e.newState === 'closed') tooltipState.hide(e.currentTarget.style.positionAnchor);
      }}
      transition:fade={{ duration: ANIMATION_SPEED.FADE_FAST }}
      class="tooltip-popover fixed p-0 border-none outline-none bg-transparent pointer-events-none overflow-visible"
      style:position-anchor={tooltipState.current.anchorName}
    >
      <div class="px-3 py-1.5 bg-text text-bg text-xs rounded-lg font-bold tracking-wide shadow-float max-w-[200px] text-center text-balance leading-relaxed">
        {tooltipState.current.msg}
      </div>
    </div>
  {/key}
{/if}