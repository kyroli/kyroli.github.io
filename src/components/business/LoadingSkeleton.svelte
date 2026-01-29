<script lang="ts">
  import CardBase from './CardBase.svelte';

  const containerClass = "w-full flex flex-col gap-5 pt-6 pb-0";
  const groupClass = "flex flex-col gap-4 animate-pulse";
  const headerClass = "flex items-center gap-3 pb-3 px-1 h-10 mt-3 border-b border-border/40";
  const headerBarClass = "h-3 w-24 bg-border/40 rounded-sm";
  const gridClass = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6";
  
  const iconClass = "shrink-0 w-10 h-10 rounded-[10px] bg-icon-bg";
  const textWrapperClass = "flex flex-col gap-2.5 flex-1";
  const titleClass = "h-3.5 w-3/4 bg-border/40 rounded-md";
  const subtitleClass = "h-2.5 w-1/2 bg-border/20 rounded-md";
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