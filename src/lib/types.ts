export interface Site {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface Group {
  id: string;
  name: string;
  sites: Site[];
}

export interface NavData {
  groups: Group[];
}

export interface GithubConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface AppConfig {
  github: GithubConfig;
  theme: 'light' | 'dark' | 'system';
}

export type SyncStatus = 'idle' | 'checking' | 'syncing' | 'success' | 'error' | 'conflict';

export interface SyncResult {
  success: boolean;
  error?: string;
  remoteData?: NavData;
  remoteSha?: string;
}

export interface RemoteFile {
  sha: string;
  content: string;
}