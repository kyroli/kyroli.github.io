import { SvelteMap } from 'svelte/reactivity';

class UIState {
  groupNodes = new SvelteMap<string, HTMLElement>();

  registerGroup(id: string, node: HTMLElement) {
    this.groupNodes.set(id, node);
  }

  unregisterGroup(id: string) {
    this.groupNodes.delete(id);
  }

  getGroupNode(id: string) {
    return this.groupNodes.get(id);
  }
}

export const uiState = new UIState();