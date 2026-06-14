import { APP_TIMEOUTS } from '../constants';
import { appState } from '../core/app.svelte';

let tooltipIdCounter = 0;

export function tooltip(msg?: string | null) {
  return (element: HTMLElement) => {
    if (!msg) return;

    const tooltipId = `--tooltip-anchor-${++tooltipIdCounter}`;
    let hoverTimeout: ReturnType<typeof setTimeout>;
    let isVisible = false;

    function applyA11y(text: string) {
      element.setAttribute('aria-label', text);
      if (element.hasAttribute('title')) {
        element.removeAttribute('title');
      }
    }

    const isHoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isHoverable) {
      applyA11y(msg);
      return;
    }

    // Register the element as an anchor
    element.style.anchorName = tooltipId;
    applyA11y(msg);

    const forceHide = () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (isVisible) {
        appState.hideTooltip();
        isVisible = false;
      }
    };

    const show = () => {
      appState.showTooltip(msg, tooltipId);
      isVisible = true;
    };

    const onMouseEnter = () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(show, APP_TIMEOUTS.TOOLTIP_DELAY);
    };

    const onFocus = () => {
      try {
        if (!element.matches(':focus-visible')) return;
      } catch (e) {}
      onMouseEnter();
    };

    const onMouseLeave = () => forceHide();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) forceHide();
    };

    element.addEventListener('mouseenter', onMouseEnter);
    element.addEventListener('mouseleave', onMouseLeave);
    element.addEventListener('focus', onFocus);
    element.addEventListener('blur', onMouseLeave);
    element.addEventListener('mousedown', forceHide);
    element.addEventListener('keydown', onKeyDown);

    return () => {
      forceHide();
      element.style.anchorName = '';
      element.removeEventListener('mouseenter', onMouseEnter);
      element.removeEventListener('mouseleave', onMouseLeave);
      element.removeEventListener('focus', onFocus);
      element.removeEventListener('blur', onMouseLeave);
      element.removeEventListener('mousedown', forceHide);
      element.removeEventListener('keydown', onKeyDown);
    };
  };
}
