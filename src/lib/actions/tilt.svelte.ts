interface TiltOptions {
  disabled?: boolean;
  maxRotate?: number; // 最大旋转角度
  scale?: number; // 悬停缩放大小
}

export function tilt(options: TiltOptions = {}) {
  return (element: HTMLElement) => {
    // 仅在有 hover 能力的指针设备上启用
    const isHoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let rect: DOMRect | null = null;
    let isInside = false;

    let rafId: number | null = null;
    let latestEvent: MouseEvent | null = null;

    function handleMouseEnter() {
      if (options.disabled || !isHoverable) return;
      rect = element.getBoundingClientRect();
      isInside = true;
      element.style.setProperty('--scale', String(options.scale ?? 1.02));
      element.style.setProperty('--shine-opacity', '1');
      element.style.willChange = 'transform';
    }

    function updateTilt() {
      if (!latestEvent || options.disabled || !isHoverable || !isInside) {
        rafId = null;
        return;
      }
      if (!rect) rect = element.getBoundingClientRect();

      const x = latestEvent.clientX - rect.left;
      const y = latestEvent.clientY - rect.top;

      const w = rect.width;
      const h = rect.height;

      // 映射到 [-1, 1] 区间
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
      if (options.disabled || !isHoverable || !isInside) return;
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

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      element.style.setProperty('--rx', '0deg');
      element.style.setProperty('--ry', '0deg');
      element.style.setProperty('--scale', '1');
      element.style.setProperty('--shine-opacity', '0');
      element.style.willChange = '';
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  };
}
