import type { NavData, GithubConfig, GithubFileResponse, GithubPushResponse } from './types';

const API = 'https://api.github.com/repos';

const headers = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json'
});

const blobToBase64 = (data: unknown): Promise<string> => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        // [Complexity] DataURL 格式为 "data:application/json;base64,xxxxx"，需截取逗号后的部分
        resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
};

export async function getRemoteInfo(cfg: GithubConfig): Promise<{ sha: string; content: NavData }> {
  const repoUrl = `${API}/${cfg.owner}/${cfg.repo}`;
  const repoRes = await fetch(repoUrl, { headers: headers(cfg.token) });

  if (repoRes.status === 404) throw new Error('REPO_NOT_FOUND');
  if (repoRes.status === 401) throw new Error('TOKEN_INVALID');
  if (!repoRes.ok) throw new Error(`HTTP_ERROR_${repoRes.status}`);

  const fileUrl = `${API}/${cfg.owner}/${cfg.repo}/contents/bookmarks.json`;
  const res = await fetch(fileUrl, { headers: headers(cfg.token) });
  
  if (res.status === 404) return { sha: '', content: { groups: [] } };
  
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);

  // 使用显式断言而非隐式 any
  const json = (await res.json()) as GithubFileResponse;
  
  // GitHub API 返回内容为 Base64，需经过 Base64 -> Binary -> UTF8 解码链
  const decoded = new TextDecoder().decode(
    Uint8Array.from(atob(json.content), c => c.charCodeAt(0))
  );
  
  // 假设解码后的 JSON 符合 NavData 结构，生产环境可增加校验
  return {
    sha: json.sha,
    content: JSON.parse(decoded) as NavData
  };
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
    throw new Error('CONFLICT');
  }

  if (!res.ok) throw new Error('PUSH_FAILED');
  
  const json = (await res.json()) as GithubPushResponse;
  return json.content.sha;
}