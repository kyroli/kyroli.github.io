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

// API 响应契约
export interface GithubFileResponse {
  sha: string;
  content: string; // Base64 encoded
}

export interface GithubPushResponse {
  content: {
    sha: string;
  };
}