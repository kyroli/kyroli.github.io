import type { GithubConfig, NavData, RemoteFile } from '../types';
import { MESSAGES } from '../i18n';

export const GITHUB_ERRORS = {
  TOKEN_INVALID: 'TOKEN_INVALID',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT'
} as const;

const API_BASE = 'https://api.github.com/repos';

export class GithubClient {
  constructor(private config: GithubConfig) {}

  static parseRepoPath(path: string): { owner: string; repo: string } {
    const parts = path.split('/');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      throw new Error('Invalid repository format');
    }
    return { owner: parts[0].trim(), repo: parts[1].trim() };
  }

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

    if (res.status === 401) throw new Error(GITHUB_ERRORS.TOKEN_INVALID);
    if (res.status === 404) throw new Error(GITHUB_ERRORS.NOT_FOUND);
    if (res.status === 409) throw new Error(GITHUB_ERRORS.CONFLICT);
    if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);

    return res.json() as Promise<T>;
  }

  async getFile(path: string = 'bookmarks.json'): Promise<RemoteFile | null> {
    try {
      return await this.request<RemoteFile>(`/contents/${path}`);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === GITHUB_ERRORS.NOT_FOUND) return null;
      throw e;
    }
  }

  async updateFile(path: string, content: NavData, sha?: string): Promise<{ sha: string }> {
    const jsonStr = JSON.stringify(content, null, 2);
    
    const base64Content = new TextEncoder().encode(jsonStr).toBase64();
    
    const body = {
      message: MESSAGES.UI.GIT_COMMIT_MSG,
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
      const bytes = Uint8Array.fromBase64(base64, { lastChunkHandling: 'loose' });
      const decoder = new TextDecoder();
      const json = decoder.decode(bytes);
      return JSON.parse(json);
    } catch {
      throw new Error('PARSE_ERROR');
    }
  }
}