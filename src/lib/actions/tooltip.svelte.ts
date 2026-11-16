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

    element.removeAttribute('title');
    let managedAriaLabel = false;
    if (
      !element.textContent?.trim() &&
      !element.hasAttribute('aria-label') &&
      element.matches('button, a[href]')
    ) {
      element.setAttribute('aria-label', msg);
      managedAriaLabel = true;
    }

    if (!isHoverable.current) {
      return () => {
        if (managedAriaLabel) element.removeAttribute('aria-label');
      };
    }

    const tooltipId = `--tooltip-anchor-${++tooltipIdCounter}`;
    let hoverTimeout: ReturnType<typeof setTimeout> | undefined;

    // Register the element as an anchor
    const prevAnchor = element.style.anchorName;
    element.style.anchorName = prevAnchor ? `${prevAnchor}, ${tooltipId}` : tooltipId;

    const forceHide = () => {
      clearTimeout(hoverTimeout);
      tooltipState.hide(tooltipId);
    };

    const onMouseEnter = () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(
        () => tooltipState.show(msg, tooltipId),
        APP_TIMEOUTS.TOOLTIP_DELAY
      );
    };

    const offs = [
      on(element, 'mouseenter', onMouseEnter),
      on(element, 'mouseleave', forceHide),
      on(element, 'focus', () => {
        if (element.matches(':focus-visible')) onMouseEnter();
      }),
      on(element, 'blur', forceHide),
      on(element, 'mousedown', forceHide),
      on(element, 'keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') forceHide();
      })
    ];

    return () => {
      forceHide();
      if (managedAriaLabel) element.removeAttribute('aria-label');
      element.style.anchorName = prevAnchor;
      for (const off of offs) off();
    };
  };
}
