interface TiltOptions {
  disabled?: boolean;
  maxRotate?: number; // 最大旋转角度
  scale?: number; // 悬停缩放大小
}

export function tilt(node: HTMLElement, options: () => TiltOptions) {
  let activeOptions = options();

  // 仅在有 hover 能力的指针设备上启用
  const isHoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let rect: DOMRect | null = null;
  let isInside = false;

  let rafId: number | null = null;
  let latestEvent: MouseEvent | null = null;

  function handleMouseEnter() {
    if (activeOptions.disabled || !isHoverable) return;
    rect = node.getBoundingClientRect();
    isInside = true;
    node.style.setProperty('--scale', String(activeOptions.scale ?? 1.02));
    node.style.setProperty('--shine-opacity', '1');
    node.style.willChange = 'transform';
  }

  function updateTilt() {
    if (!latestEvent || activeOptions.disabled || !isHoverable || !isInside) {
      rafId = null;
      return;
    }
    if (!rect) rect = node.getBoundingClientRect();

    const x = latestEvent.clientX - rect.left;
    const y = latestEvent.clientY - rect.top;

    const w = rect.width;
    const h = rect.height;

    // 映射到 [-1, 1] 区间
    const dx = (x - w / 2) / (w / 2);
    const dy = (y - h / 2) / (h / 2);

    const maxRotate = activeOptions.maxRotate ?? 10;
    const rx = -dy * maxRotate;
    const ry = dx * maxRotate;

    node.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    node.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    node.style.setProperty('--mx', `${x.toFixed(1)}px`);
    node.style.setProperty('--my', `${y.toFixed(1)}px`);

    rafId = null;
  }

  function handleMouseMove(e: MouseEvent) {
    if (activeOptions.disabled || !isHoverable || !isInside) return;
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
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
    node.style.setProperty('--scale', '1');
    node.style.setProperty('--shine-opacity', '0');
    node.style.willChange = '';
  }

  node.addEventListener('mouseenter', handleMouseEnter);
  node.addEventListener('mousemove', handleMouseMove);
  node.addEventListener('mouseleave', handleMouseLeave);

  return {
    update(newOptions: () => TiltOptions) {
      const prevDisabled = activeOptions.disabled;
      activeOptions = newOptions();
      if (activeOptions.disabled && !prevDisabled) {
        handleMouseLeave();
      }
    },
    destroy() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mousemove', handleMouseMove);
      node.removeEventListener('mouseleave', handleMouseLeave);
    }
  };
}
