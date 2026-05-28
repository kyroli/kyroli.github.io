<script lang="ts">
import { GripVertical, Trash2 } from '@lucide/svelte';
import { appState } from '$lib/core/app.svelte';
import { MESSAGES } from '$lib/i18n';
import { draggable } from '$lib/actions/dnd.svelte';
import { tooltip } from '$lib/actions/tooltip';

let { group, onDelete } = $props<{
  group: { id: string; name: string };
  onDelete: (name: string, id: string) => void;
}>();
</script>

<div class="flex items-center gap-3 pb-2 h-11 border-b border-border/40 group/header justify-between">
  {#if appState.isEditMode}
    <button 
      onclick={() => appState.openGroupModal(group.id)}
      class="text-xs font-bold tracking-widest text-text-dim hover:text-primary transition-colors cursor-pointer uppercase truncate text-left opacity-80"
      use:tooltip={MESSAGES.UI.TIP_RENAME_GROUP}
    >
      {group.name}
    </button>
  {:else}
    <h2 class="text-xs font-bold tracking-widest text-text-dim uppercase opacity-80">{group.name}</h2>
  {/if}
  
  <div class={`flex items-center gap-2 transition-all duration-200 ${
    appState.isEditMode ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
  }`}>
    <div 
      class="cursor-grab text-text-dim hover:text-primary active:scale-95 transition-all p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border"
      use:draggable={{ type: 'group', id: group.id, groupId: null }}
      use:tooltip={MESSAGES.UI.TIP_DRAG_SORT}
    >
      <GripVertical class="w-5 h-5" />
    </div>

    <button 
      onclick={() => onDelete(group.name, group.id)} 
      class="text-text-dim hover:text-danger hover:bg-surface p-2 rounded-lg transition-all cursor-pointer border border-transparent hover:border-border/50 active-press-icon" 
      use:tooltip={MESSAGES.UI.TIP_DELETE_GROUP}
    >
      <Trash2 class="w-5 h-5" />
    </button>
  </div>
</div>
