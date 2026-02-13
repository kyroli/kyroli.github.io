import type { SearchEngine } from '../types';
import bing from '../../assets/bing.png';
import google from '../../assets/google.png';
import duckduckgo from '../../assets/duckduckgo.png';
import yandex from '../../assets/yandex.png';

export const DEFAULT_ENGINE_ID = 'bing';

export const SEARCH_ENGINES: Record<string, SearchEngine> = {
  bing: { 
    id: 'bing',
    name: 'Bing', 
    url: 'https://www.bing.com/search?q=', 
    icon: bing,
    placeholder: 'Search Bing...'
  },
  google: { 
    id: 'google',
    name: 'Google', 
    url: 'https://www.google.com/search?q=', 
    icon: google, 
    placeholder: 'Search Google...'
  },
  duckduckgo: { 
    id: 'duckduckgo',
    name: 'DuckDuckGo', 
    url: 'https://duckduckgo.com/?q=', 
    icon: duckduckgo, 
    placeholder: 'Search DuckDuckGo...' 
  },
  yandex: { 
    id: 'yandex',
    name: 'Yandex', 
    url: 'https://yandex.com/search/?text=', 
    icon: yandex,
    placeholder: 'Search Yandex...' 
  },
};