import type { NavData, GithubConfig } from './types';

export const Validation = {
  // URL 检查
  url(url: string): { valid: boolean; value: string; error?: string } {
    const trimmed = url.trim();
    if (!trimmed) return { valid: false, value: '', error: '链接不能为空' };
    
    // 自动补全协议
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    
    try {
      const u = new URL(withProtocol);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { valid: false, value: '', error: '仅支持 HTTP/HTTPS 协议' };
      }
      return { valid: true, value: withProtocol };
    } catch {
      return { valid: false, value: '', error: '无效的链接格式' };
    }
  },

  // 数据结构清洗
  navData(data: any): NavData {
    if (!data || typeof data !== 'object') return { groups: [] };
    
    const groups = Array.isArray(data.groups) ? data.groups.map((g: any) => ({
      id: typeof g.id === 'string' ? g.id : crypto.randomUUID(),
      name: typeof g.name === 'string' ? g.name : '未命名分组',
      sites: Array.isArray(g.sites) ? g.sites.map((s: any) => {
        const urlRes = Validation.url(s.url || '');
        return {
          id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
          name: typeof s.name === 'string' ? s.name : '未命名站点',
          url: urlRes.valid ? urlRes.value : '',
          icon: typeof s.icon === 'string' ? s.icon : ''
        };
      }).filter((s: any) => s.url) : []
    })) : [];

    return { groups };
  },

  // 配置检查
  config(cfg: GithubConfig): { valid: boolean; error?: string } {
    if (!cfg.token) return { valid: false, error: 'Token 不能为空' };
    if (!cfg.owner || !cfg.repo) return { valid: false, error: '仓库信息不完整' };
    return { valid: true };
  }
};