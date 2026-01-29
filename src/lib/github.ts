import type { NavData, GithubConfig, GithubFileResponse, GithubPushResponse } from './types';
import { AppError } from './utils';

const API = 'https://api.github.com/repos';

const headers = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json'
});

const blobToBase64 = (data: unknown): Promise<string> => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        if (!result) {
            reject(new AppError('SERVER_ERROR', 'Blob conversion failed'));
            return;
        }
        const parts = result.split(',');
        resolve(parts.length > 1 ? parts[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

export async function getRemoteInfo(cfg: GithubConfig): Promise<{ sha: string; content: NavData }> {
  const repoUrl = `${API}/${cfg.owner}/${cfg.repo}`;
  const repoRes = await fetch(repoUrl, { headers: headers(cfg.token) });

  if (repoRes.status === 404) throw new AppError('REPO_NOT_FOUND');
  if (repoRes.status === 401) throw new AppError('TOKEN_INVALID');
  if (!repoRes.ok) throw new AppError(`HTTP_${repoRes.status}`);

  const fileUrl = `${API}/${cfg.owner}/${cfg.repo}/contents/bookmarks.json`;
  const res = await fetch(fileUrl, { headers: headers(cfg.token) });
  
  if (res.status === 404) return { sha: '', content: { groups: [] } };
  if (!res.ok) throw new AppError(`HTTP_${res.status}`);

  const json = (await res.json()) as GithubFileResponse;
  
  try {
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(json.content), c => c.charCodeAt(0))
    );
    return {
      sha: json.sha,
      content: JSON.parse(decoded) as NavData
    };
  } catch {
    throw new AppError('SERVER_ERROR', 'File decode failed');
  }
}

export async function pushNav(cfg: GithubConfig, data: NavData, baseSha: string): Promise<string> {
  const url = `${API}/${cfg.owner}/${cfg.repo}/contents/bookmarks.json`;
  
  const content = await blobToBase64(data);
  const body = {
    message: 'update bookmarks',
    content,
    sha: baseSha || undefined
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(cfg.token),
    body: JSON.stringify(body)
  });

  if (res.status === 409) {
    throw new AppError('CONFLICT');
  }

  if (!res.ok) throw new AppError('PUSH_FAILED');
  
  const json = (await res.json()) as GithubPushResponse;
  return json.content.sha;
}