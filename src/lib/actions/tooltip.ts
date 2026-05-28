import { APP_TIMEOUTS } from '../constants';
import { appState } from '../core/app.svelte';

let tooltipIdCounter = 0;

export function tooltip(node: HTMLElement, msg?: string | null) {
  if (!msg) return;

  const tooltipId = `--tooltip-anchor-${++tooltipIdCounter}`;
  let currentMsg = msg;
  let hoverTimeout: ReturnType<typeof setTimeout>;
  let isVisible = false;

  function applyA11y(text: string) {
    node.setAttribute('aria-label', text);
    if (node.hasAttribute('title')) {
      node.removeAttribute('title');
    }
  }

  const isHoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isHoverable) {
    applyA11y(currentMsg);
    return {
      update(newMsg?: string | null) {
        if (newMsg) applyA11y(newMsg);
      }
    };
  }

  // Register the element as an anchor
  node.style.anchorName = tooltipId;
  applyA11y(currentMsg);

  const forceHide = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (isVisible) {
      appState.hideTooltip();
      isVisible = false;
    }
  };

  const show = () => {
    if (!currentMsg) return;
    appState.showTooltip(currentMsg, tooltipId);
    isVisible = true;
  };

  const onMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(show, APP_TIMEOUTS.TOOLTIP_DELAY);
  };

  const onFocus = () => {
    try {
      if (!node.matches(':focus-visible')) return;
    } catch (e) {}
    onMouseEnter();
  };

  const onMouseLeave = () => forceHide();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible) forceHide();
  };

  node.addEventListener('mouseenter', onMouseEnter);
  node.addEventListener('mouseleave', onMouseLeave);
  node.addEventListener('focus', onFocus);
  node.addEventListener('blur', onMouseLeave);
  node.addEventListener('mousedown', forceHide);
  node.addEventListener('keydown', onKeyDown);

  return {
    update(newMsg?: string | null) {
      if (!newMsg) {
        currentMsg = '';
        forceHide();
        return;
      }
      currentMsg = newMsg;
      applyA11y(currentMsg);

      if (isVisible) {
        appState.updateTooltip(currentMsg, tooltipId);
      }
    },
    destroy() {
      forceHide();
      node.style.anchorName = '';
      node.removeEventListener('mouseenter', onMouseEnter);
      node.removeEventListener('mouseleave', onMouseLeave);
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', onMouseLeave);
      node.removeEventListener('mousedown', forceHide);
      node.removeEventListener('keydown', onKeyDown);
    }
  };
}
