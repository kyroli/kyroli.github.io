import type { Action } from 'svelte/action';
import type Sortable from 'sortablejs';
import { appState } from '$lib/core/app.svelte';
interface SortableParams<T> {
  items: T[];
  onSort: (items: T[]) => void;
  onTransfer?: (itemId: string, newIndex: number) => void;
  group?: string;
  disabled?: boolean;
  handle?: string;
  draggable?: string;
}

export const sortable: Action<HTMLElement, SortableParams<any>> = (node, params) => {
  let instance: Sortable | undefined;
  let isDestroyed = false; 

  const loadAndInit = async () => {
    if (instance || isDestroyed || params.disabled) return;

    try {
      const SortableClass = (await import('sortablejs')).default;

      if (isDestroyed || params.disabled) return;

      instance = new SortableClass(node, {
        group: params.group,
        animation: 250,
        delay: 0,
        handle: params.handle, 
        draggable: params.draggable,
        disabled: false,
        ghostClass: 'opacity-40', 
        dragClass: 'cursor-grabbing', 
        
        onUpdate: (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
          
          const newItems = [...params.items];
          const [moved] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, moved);
          params.onSort(newItems);
        },

        onAdd: (evt) => {
          const { newIndex, item } = evt;
          const itemId = item.dataset.id;
          
          if (itemId && newIndex !== undefined && params.onTransfer) {
            params.onTransfer(itemId, newIndex);
          }
        }
      });
    } catch (e) {
      console.error('Failed to load SortableJS', e);
      appState.showToast('拖拽组件加载失败，请检查网络连接', 'error');
      appState.toggleEditMode();
    }
  };

  if (!params.disabled) {
    loadAndInit();
  }

  return {
    update(newParams: SortableParams<any>) {
      params = newParams;
      
      if (!params.disabled) {
        if (!instance) {
          loadAndInit();
        } else {
          instance.option('disabled', false);
        }
      } else {
        if (instance) {
          instance.option('disabled', true);
        }
      }
    },
    
    destroy() {
      isDestroyed = true;
      if (instance) {
        instance.destroy();
        instance = undefined;
      }
    }
  };
};