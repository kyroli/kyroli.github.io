import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { isHoverable } from '../utils';

interface TiltOptions {
  disabled?: boolean;
  maxRotate?: number; // Maximum rotation angle
  scale?: number; // Hover scale factor
}

export function tilt(options: TiltOptions = {}): Attachment<HTMLElement> {
  return (element: HTMLElement) => {
    // Only enable on pointer devices with hover capability
    if (options.disabled || !isHoverable.current) return;

    let rect: DOMRect | null = null;
    let isInside = false;

    let rafId: number | null = null;
    let latestEvent: MouseEvent | null = null;

    function handleMouseEnter() {
      rect = element.getBoundingClientRect();
      isInside = true;
      element.style.setProperty('--scale', String(options.scale ?? 1.02));
      element.style.setProperty('--shine-opacity', '1');
      element.style.willChange = 'transform';
    }

    function updateTilt() {
      if (!latestEvent || !isInside) {
        rafId = null;
        return;
      }
      if (!rect) rect = element.getBoundingClientRect();

      const x = latestEvent.clientX - rect.left;
      const y = latestEvent.clientY - rect.top;

      const w = rect.width;
      const h = rect.height;

      // Map to [-1, 1] range
      const dx = (x - w / 2) / (w / 2);
      const dy = (y - h / 2) / (h / 2);

      const maxRotate = options.maxRotate ?? 10;
      const rx = -dy * maxRotate;
      const ry = dx * maxRotate;

      element.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      element.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      element.style.setProperty('--mx', `${x.toFixed(1)}px`);
      element.style.setProperty('--my', `${y.toFixed(1)}px`);

      rafId = null;
    }

    function handleMouseMove(e: MouseEvent) {
      if (!isInside) return;
      latestEvent = e;
      if (rafId === null) {
        rafId = requestAnimationFrame(updateTilt);
      }
    }

    function handleMouseLeave() {
      isInside = false;
      rect = null;
      latestEvent = null;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      element.style.setProperty('--rx', '0deg');
      element.style.setProperty('--ry', '0deg');
      element.style.setProperty('--scale', '1');
      element.style.setProperty('--shine-opacity', '0');
      element.style.willChange = '';
    }

    const offs = [
      on(element, 'mouseenter', handleMouseEnter),
      on(element, 'mousemove', handleMouseMove),
      on(element, 'mouseleave', handleMouseLeave)
    ];

    return () => {
      handleMouseLeave();
      for (const off of offs) off();
    };
  };
}
