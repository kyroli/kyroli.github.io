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
  if (custom && (custom.startsWith('http://') || custom.startsWith('https://'))) {
    return custom;
  }

  if (custom && assets[custom.toLowerCase()]) {
    return assets[custom.toLowerCase()];
  }
  
  try {
    const domain = new URL(url).hostname;
    const originalUrl = `icons.bitwarden.net/${domain}/icon.png`;
    return `https://wsrv.nl/?url=${originalUrl}&w=80&h=80&output=webp&q=85&il`;
  } catch (e) {
    return assets['globe'] || '';
  }
};

export const DEFAULT_ICON = assets['globe'] || '';