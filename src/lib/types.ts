export interface Site {
  id: string;
  name: string;
  url: string;
  icon: string;
  invert?: boolean;
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

export type SyncStatus = 'idle' | 'checking' | 'syncing' | 'success' | 'error' | 'conflict';

export interface RemoteFile {
  sha: string;
  content: string;
}

export interface DndPayload {
  type: 'group' | 'site';
  srcId: string;
  targetGroupId: string | null;
  targetIndex: number;
}