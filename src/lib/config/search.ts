import { Search, Globe, Bird, Circle} from 'lucide-svelte';
import type { SearchEngine } from '../types';

export const DEFAULT_ENGINE_ID = 'bing';

export const SEARCH_ENGINES: Record<string, SearchEngine> = {
  bing: { 
    id: 'bing',
    name: 'Bing', 
    url: 'https://www.bing.com/search?q=', 
    icon: Search,
    placeholder: 'Search Bing...'
  },
  google: { 
    id: 'google',
    name: 'Google', 
    url: 'https://www.google.com/search?q=', 
    icon: Globe, 
    placeholder: 'Search Google...'
  },
  duckduckgo: { 
    id: 'duckduckgo',
    name: 'DuckDuckGo', 
    url: 'https://duckduckgo.com/?q=', 
    icon: Bird, 
    placeholder: 'Search DuckDuckGo...' 
  },
  yandex: { 
    id: 'yandex',
    name: 'Yandex', 
    url: 'https://yandex.com/search/?text=', 
    icon: Circle,
    placeholder: 'Search Yandex...' 
  },
};