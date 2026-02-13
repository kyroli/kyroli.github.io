import { MESSAGES } from './i18n';

export const UI_CONSTANTS = {
  CARD_HEIGHT: "h-[72px]",
  SEARCH_ENGINE_URL: "https://www.bing.com/search?q=",
  GRID_LAYOUT: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6"
} as const;

interface AssetModule {
  default?: string;
  src?: string;
}

const glob = import.meta.glob<AssetModule>('../assets/*.{png,jpg,jpeg,webp,svg}', { eager: true });

const assets = Object.fromEntries(
  Object.entries(glob)
    .filter(([_, module]) => !!module)
    .map(([path, module]) => {
      const fileName = path.split('/').pop()?.split('.')[0].toLowerCase() ?? '';
      const src = module?.default ?? module?.src ?? '';
      return [fileName, src];
    })
);

export const getIcon = (url: string, custom?: string): string => {
  // 1. 优先使用自定义图标
  if (custom && assets[custom.toLowerCase()]) {
    return assets[custom.toLowerCase()];
  }
  
  try {
    const domain = new URL(url).hostname;
    // 使用 Bitwarden 图标服务作为源
    const originalUrl = `icons.bitwarden.net/${domain}/icon.png`;
    // 使用 wsrv.nl 进行图片优化和转换 (webp)
    return `https://wsrv.nl/?url=${originalUrl}&w=128&h=128&output=webp&q=85&il`;
  } catch (e) {
    // 2. 发生错误时，返回本地默认地球图标 (import.meta.glob 解析后)
    return assets['globe'] || '';
  }
};