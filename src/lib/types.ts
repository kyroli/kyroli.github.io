export interface NavData {
  groups: Group[];
}

export interface Group {
  id: string;
  name: string;
  sites: Site[];
}

export interface Site {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface GithubConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface ToastState {
  msg: string;
  type: 'info' | 'error' | 'success';
}

export interface GithubFileResponse {
  sha: string;
  content: string;
}

export interface GithubPushResponse {
  content: {
    sha: string;
  };
}

export type OpResult<T = void> = 
  | { success: true; data?: T; msg?: string }
  | { success: false; type: 'conflict'; serverData?: NavData; serverSha?: string; msg: string }
  | { success: false; type: 'error'; msg: string };