import type { GithubConfig, NavData, RemoteFile } from '../types';

const API_BASE = 'https://api.github.com/repos';

export class GithubClient {
  constructor(private config: GithubConfig) {}

  private get headers() {
    return {
      'Authorization': `Bearer ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}/${this.config.owner}/${this.config.repo}${endpoint}`;
    const res = await fetch(url, { ...options, headers: this.headers });

    if (res.status === 401) throw new Error('TOKEN_INVALID');
    if (res.status === 404) throw new Error('NOT_FOUND');
    if (res.status === 409) throw new Error('CONFLICT');
    if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);

    return res.json() as Promise<T>;
  }

  async getFile(path: string = 'bookmarks.json'): Promise<RemoteFile | null> {
    try {
      return await this.request<RemoteFile>(`/contents/${path}`);
    } catch (e: any) {
      if (e.message === 'NOT_FOUND') return null;
      throw e;
    }
  }

  async updateFile(path: string, content: NavData, sha?: string): Promise<{ sha: string }> {
    const jsonStr = JSON.stringify(content, null, 2);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonStr);
    const binaryStr = Array.from(data, b => String.fromCharCode(b)).join('');
    const base64Content = btoa(binaryStr);
    
    const body = {
      message: 'update bookmarks via nav-zero',
      content: base64Content,
      sha
    };

    const res = await this.request<{ content: { sha: string } }>(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    return res.content;
  }

  static parseContent(base64: string): NavData {
    try {
      const binaryStr = atob(base64);
      const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
      const decoder = new TextDecoder();
      const json = decoder.decode(bytes);
      return JSON.parse(json);
    } catch {
      throw new Error('PARSE_ERROR');
    }
  }
}