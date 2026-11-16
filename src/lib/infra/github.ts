import { MESSAGES } from '../i18n';
import type { GithubConfig, NavData, RemoteFile } from '../types';

export const GITHUB_ERRORS = {
  TOKEN_INVALID: 'TOKEN_INVALID',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INVALID_REPO_FORMAT: 'INVALID_REPO_FORMAT'
} as const;

const API_BASE = 'https://api.github.com/repos';

export class GithubClient {
  constructor(private config: GithubConfig) {}

  static parseRepoPath(path: string): { owner: string; repo: string } {
    const parts = path.split('/').map((s) => s.trim());
    const validSegment = /^(?!\.{1,2}$)[a-zA-Z0-9._-]+$/;
    if (parts.length !== 2 || !validSegment.test(parts[0]) || !validSegment.test(parts[1])) {
      throw new Error(GITHUB_ERRORS.INVALID_REPO_FORMAT);
    }
    return { owner: parts[0], repo: parts[1] };
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.config.token}`,
      Accept: 'application/vnd.github.v3+json',
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

  async getFile(path: string = 'profile.json', signal?: AbortSignal): Promise<RemoteFile | null> {
    try {
      return await this.request<RemoteFile>(`/contents/${path}`, { signal });
    } catch (e: unknown) {
      if (e instanceof Error && e.message === GITHUB_ERRORS.NOT_FOUND) return null;
      throw e;
    }
  }

  async updateFile(
    path: string,
    content: NavData,
    sha?: string,
    signal?: AbortSignal
  ): Promise<{ sha: string }> {
    const jsonStr = JSON.stringify(content, null, 2);

    const base64Content = new TextEncoder().encode(jsonStr).toBase64();

    const body = {
      message: MESSAGES.UI.GIT_COMMIT_MSG,
      content: base64Content,
      sha
    };

    const res = await this.request<{ content: { sha: string } }>(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      signal
    });

    return res.content;
  }

  static parseContent(base64: string): NavData {
    try {
      const bytes = Uint8Array.fromBase64(base64, { lastChunkHandling: 'loose' });
      const decoder = new TextDecoder();
      const parsed: unknown = JSON.parse(decoder.decode(bytes));
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('PARSE_ERROR');
      }
      return parsed as NavData;
    } catch {
      throw new Error('PARSE_ERROR');
    }
  }
}
