import { appState } from '../core/app.svelte';

export function tooltip(node: HTMLElement, msg?: string | null) {
  if (!msg) return;

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

  applyA11y(currentMsg);

  const calculatePos = () => {
    const rect = node.getBoundingClientRect();
    const tooltipGap = 10;
    
    let x = rect.left + rect.width / 2;
    let y = rect.top - tooltipGap;
    let position: 'top' | 'bottom' = 'top';

    if (rect.top < 50) {
      y = rect.bottom + tooltipGap;
      position = 'bottom';
    }

    const margin = 10;
    const maxVW = window.innerWidth;
    
    if (x < margin + 50) x = margin + 50; 
    if (x > maxVW - margin - 50) x = maxVW - margin - 50;

    return { x, y, position };
  };

  const forceHide = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (isVisible) {
      appState.hideTooltip();
      isVisible = false;
      window.removeEventListener('scroll', forceHide, { capture: true });
      window.removeEventListener('resize', forceHide, { capture: true });
    }
  };

  const show = () => {
    if (!currentMsg) return;
    const { x, y, position } = calculatePos();
    appState.showTooltip(currentMsg, x, y, position);
    isVisible = true;

    window.addEventListener('scroll', forceHide, { passive: true, once: true, capture: true });
    window.addEventListener('resize', forceHide, { passive: true, once: true, capture: true });
  };

  const onMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(show, 250);
  };

  const onFocus = () => {
    try {
      if (!node.matches(':focus-visible')) return;
    } catch (e) {
      // 忽略此异常：向下兼容不支持 :focus-visible 伪类的老旧浏览器
    }
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
        const { x, y, position } = calculatePos();
        appState.updateTooltip(currentMsg, x, y, position);
      }
    },
    destroy() {
      forceHide();
      node.removeEventListener('mouseenter', onMouseEnter);
      node.removeEventListener('mouseleave', onMouseLeave);
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', onMouseLeave);
      node.removeEventListener('mousedown', forceHide);
      node.removeEventListener('keydown', onKeyDown);
    }
  };
}