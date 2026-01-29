export interface NavData {
  groups: Group[];
  deletedIds?: string[];
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