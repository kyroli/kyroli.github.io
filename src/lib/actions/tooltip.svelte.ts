import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { APP_TIMEOUTS } from '../constants';
import { isHoverable } from '../utils';

interface TooltipPayload {
  msg: string;
  anchorName: string;
}

class TooltipManager {
  current = $state<TooltipPayload | null>(null);

  show = (msg: string, anchorName: string) => {
    this.current = { msg, anchorName };
  };

  hide = (anchorName?: string) => {
    if (this.current && (!anchorName || this.current.anchorName === anchorName)) {
      this.current = null;
    }
  };
}

export const tooltipState = new TooltipManager();

let tooltipIdCounter = 0;

export function tooltip(msg?: string | null): Attachment<HTMLElement> {
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

    if (!isHoverable.current) {
      applyA11y(msg);
      return;
    }

    // Register the element as an anchor
    const prevAnchor = element.style.anchorName;
    element.style.anchorName = prevAnchor ? `${prevAnchor}, ${tooltipId}` : tooltipId;
    applyA11y(msg);

    const forceHide = () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (isVisible) {
        tooltipState.hide(tooltipId);
        isVisible = false;
      }
    };

    const show = () => {
      tooltipState.show(msg, tooltipId);
      isVisible = true;
    };

    const onMouseEnter = () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(show, APP_TIMEOUTS.TOOLTIP_DELAY);
    };

    const onFocus = () => {
      try {
        if (!element.matches(':focus-visible')) return;
      } catch {}
      onMouseEnter();
    };

    const offs = [
      on(element, 'mouseenter', onMouseEnter),
      on(element, 'mouseleave', forceHide),
      on(element, 'focus', onFocus),
      on(element, 'blur', forceHide),
      on(element, 'mousedown', forceHide),
      on(element, 'keydown', (e) => {
        if (e.key === 'Escape' && isVisible) forceHide();
      })
    ];

    return () => {
      forceHide();
      element.style.anchorName = prevAnchor;
      for (const off of offs) off();
    };
  };
}
