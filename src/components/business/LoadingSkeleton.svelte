<script lang="ts">
  import CardBase from './CardBase.svelte';
  import { UI_CONSTANTS } from '$lib/utils';
  
  const containerClass = "w-full flex flex-col gap-5 pt-6 pb-0";
  const groupClass = "flex flex-col gap-4";
  const headerClass = "flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40 box-border";
  const headerBarClass = "h-4 w-24 bg-border/40 rounded-full animate-pulse";
  const gridClass = UI_CONSTANTS.GRID_LAYOUT;
  const iconClass = "shrink-0 w-10 h-10 rounded-xl bg-icon-bg animate-pulse";
  const textWrapperClass = "flex flex-col gap-0.5 flex-1";
  const titleClass = "h-3.5 w-3/4 bg-border/40 rounded-full animate-pulse";
  const subtitleClass = "h-2.5 w-1/2 bg-border/20 rounded-full animate-pulse";
</script>

<div class={containerClass}>
  {#each Array(3) as _}
    <div class={groupClass}>
      <div class={headerClass}>
        <div class={headerBarClass}></div>
      </div>

      <div class={gridClass}>
        {#each Array(5) as _}
          <CardBase skeleton>
             <div class={iconClass}></div>
             <div class={textWrapperClass}>
                <div class={titleClass}></div>
                <div class={subtitleClass}></div>
             </div>
          </CardBase>
        {/each}
      </div>
    </div>
  {/each}
</div>