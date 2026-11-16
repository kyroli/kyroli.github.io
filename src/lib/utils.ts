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

const getIcon = (url: string): string => {
  if (!isValidHttpUrl(url)) return DEFAULT_ICON;
  const { hostname } = new URL(url);
  return /\.[a-z]{2,}$/i.test(hostname)
    ? `https://wsrv.nl/?url=icons.bitwarden.net/${hostname}/icon.png&w=80&h=80&output=webp&q=85`
    : DEFAULT_ICON;
};

/**
 * Reactive attachment that owns the image `src` and falls back to `DEFAULT_ICON` once on load error.
 */
export function siteIcon(url: string): Attachment<HTMLImageElement> {
  const src = getIcon(url);
  return (img) => {
    if (img.getAttribute('src') !== src) img.src = src;
    if (src === DEFAULT_ICON) return;
    return on(
      img,
      'error',
      () => {
        img.src = DEFAULT_ICON;
      },
      { once: true }
    );
  };
}
