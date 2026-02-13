import type { SearchEngine } from '../types';
import BingIcon from '../../assets/bing.png';
import GoogleIcon from '../../assets/google.png';
import DuckDuckGoIcon from '../../assets/duckduckgo.png';
import YandexIcon from '../../assets/yandex.png';

export const DEFAULT_ENGINE_ID = 'bing';

export const SEARCH_ENGINES: Record<string, SearchEngine> = {
  bing: { 
    id: 'bing',
    name: 'Bing', 
    url: 'https://www.bing.com/search?q=', 
    icon: BingIcon,
    placeholder: 'Search Bing...'
  },
  google: { 
    id: 'google',
    name: 'Google', 
    url: 'https://www.google.com/search?q=', 
    icon: GoogleIcon, 
    placeholder: 'Search Google...'
  },
  duckduckgo: { 
    id: 'duckduckgo',
    name: 'DuckDuckGo', 
    url: 'https://duckduckgo.com/?q=', 
    icon: DuckDuckGoIcon, 
    placeholder: 'Search DuckDuckGo...' 
  },
  yandex: { 
    id: 'yandex',
    name: 'Yandex', 
    url: 'https://yandex.com/search/?text=', 
    icon: YandexIcon,
    placeholder: 'Search Yandex...' 
  },
};