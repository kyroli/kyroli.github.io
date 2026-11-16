import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { MediaQuery } from 'svelte/reactivity';
import DEFAULT_ICON from '../assets/globe.svg';

export const isHoverable = new MediaQuery('(hover: hover) and (pointer: fine)');
export const isDesktop = new MediaQuery('(width >= 768px)');
export const prefersReducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

export const promoteToTopLayer: Attachment<HTMLElement> = (element) => {
  element.showPopover();
};

export const normalizeHttpUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  return trimmed && !/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
};

export const isValidHttpUrl = (rawUrl: string): boolean => {
  if (!URL.canParse(rawUrl)) return false;
  const { protocol } = new URL(rawUrl);
  return protocol === 'http:' || protocol === 'https:';
};

export const getDomain = (url: string): string => new URL(url).hostname.replace(/^www\./, '');

const PRIVATE_HOST_SUFFIX =
  /\.(?:local|lan|internal|localhost|arpa|localdomain|intranet|corp|home|test|example|invalid|onion)$/i;

const getIcon = (url: string): string => {
  if (!isValidHttpUrl(url)) return DEFAULT_ICON;
  const { hostname } = new URL(url);
  if (!/\.[a-z]{2,}$/i.test(hostname) || PRIVATE_HOST_SUFFIX.test(hostname)) {
    return DEFAULT_ICON;
  }
  return `https://wsrv.nl/?url=a.favicon.im/${hostname}%3Flarger%3Dtrue&w=80&h=80&output=webp&q=85`;
};

let sampleCtx: OffscreenCanvasRenderingContext2D | null = null;

/**
 * Detects monochrome dark icons with transparent backgrounds that would blend into dark surfaces.
 */
function isDarkTransparentIcon(img: HTMLImageElement): boolean {
  const size = 16;
  sampleCtx ??= new OffscreenCanvas(size, size).getContext('2d', {
    willReadFrequently: true
  });
  if (!sampleCtx) return false;

  sampleCtx.clearRect(0, 0, size, size);
  sampleCtx.drawImage(img, 0, 0, size, size);
  const { data } = sampleCtx.getImageData(0, 0, size, size);

  let transparent = 0;
  let visible = 0;
  let bright = 0;
  let lumaSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) {
      transparent++;
      continue;
    }
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) > 64) return false;
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (luma >= 0.44) bright++;
    visible++;
    lumaSum += luma;
  }

  return visible > 0 && transparent > 16 && bright / visible < 0.05 && lumaSum / visible < 0.44;
}

const DARK_ICON_CLASSES = ['dark:invert', 'dark:hue-rotate-180'] as const;

/**
 * Reactive attachment that owns the image `src` and falls back to `DEFAULT_ICON` once on load error.
 */
export function siteIcon(url: string): Attachment<HTMLImageElement> {
  const src = getIcon(url);
  return (img) => {
    img.referrerPolicy = 'no-referrer';
    img.crossOrigin = src === DEFAULT_ICON ? null : 'anonymous';
    img.classList.remove(...DARK_ICON_CLASSES);

    if (img.getAttribute('src') !== src) img.src = src;
    if (src === DEFAULT_ICON) return;

    const updateContrast = () => {
      if (isDarkTransparentIcon(img)) img.classList.add(...DARK_ICON_CLASSES);
    };

    if (img.complete && img.naturalWidth > 0) updateContrast();
    const offLoad = on(img, 'load', updateContrast, { once: true });
    const offError = on(
      img,
      'error',
      () => {
        offLoad();
        img.src = DEFAULT_ICON;
      },
      { once: true }
    );
    return () => {
      offLoad();
      offError();
    };
  };
}
