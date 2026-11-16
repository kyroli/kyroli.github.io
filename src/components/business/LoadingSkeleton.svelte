<script lang="ts">
import { UI_CONSTANTS } from '$lib/constants';

const containerClass = 'w-full flex flex-col gap-6 sm:gap-8 pt-4 sm:pt-6 pb-0';
const groupClass = 'flex flex-col gap-4';
const headerClass =
  'flex items-center gap-3 pb-2 h-11 border-b border-border/40 box-border';
const headerBarClass = 'h-4 w-24 rounded-full shimmer';
const gridClass = UI_CONSTANTS.GRID_LAYOUT;
const cardClass = `${UI_CONSTANTS.CARD_HEIGHT} p-4 flex items-center gap-4 border border-transparent`;
const iconClass = 'shrink-0 w-10 h-10 rounded-xl shimmer';
const textWrapperClass = 'flex flex-col gap-1 flex-1';
const titleClass = 'h-3.5 w-3/4 rounded-full shimmer';
const subtitleClass = 'h-2.5 w-1/2 rounded-full shimmer';
</script>

<div class={containerClass} aria-hidden="true">
  {#each Array(3) as _}
    <div class={groupClass}>
      <div class={headerClass}>
        <div class={headerBarClass}></div>
      </div>

      <div class={gridClass}>
        {#each Array(5) as _}
          <div class={cardClass}>
             <div class={iconClass}></div>
             <div class={textWrapperClass}>
                <div class={titleClass}></div>
                <div class={subtitleClass}></div>
             </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>