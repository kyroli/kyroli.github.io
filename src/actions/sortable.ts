import Sortable from 'sortablejs';

interface SortableParams<T> {
  items: T[];
  onSort: (items: T[]) => void;
  onTransfer?: (itemId: string, newIndex: number) => void;
  group?: string;
  disabled?: boolean;
  handle?: string;
  draggable?: string;
}

export function sortable<T>(node: HTMLElement, params: SortableParams<T>) {
  let instance: Sortable | undefined;

  const init = () => {
    if (instance) instance.destroy();
    
    instance = new Sortable(node, {
      group: params.group,
      animation: 250,
      
      forceFallback: true, 
      fallbackOnBody: true,
      
      dragClass: 'cursor-grabbing', 
      ghostClass: 'opacity-40',
      fallbackClass: 'opacity-100',
      
      scroll: true, 
      bubbleScroll: true,
      scrollSensitivity: 30,
      
      delay: 0, 
      delayOnTouchOnly: true,
      touchStartThreshold: 3,
      
      handle: params.handle,
      draggable: params.draggable,
      disabled: params.disabled ?? false,
      
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
        
        item.remove();
        
        if (itemId && newIndex !== undefined && params.onTransfer) {
          params.onTransfer(itemId, newIndex);
        }
      }
    });
  };

  init();

  return {
    update(newParams: SortableParams<T>) {
      params = newParams;
      if (instance) instance.option('disabled', newParams.disabled ?? false);
    },
    destroy() {
      if (instance) instance.destroy();
    }
  };
}