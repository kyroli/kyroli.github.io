import { dataState } from '../core/data.svelte';
import { appState } from '../core/app.svelte';
import type { Group, Site, NavData } from '../types';

class DataManager {

  addGroup(name: string) {
    if (!name.trim()) throw new Error('分组名称不能为空');
    
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: name.trim(),
      sites: []
    };
    
    dataState.setGroups([...dataState.groups, newGroup]);
    appState.showToast('分组已添加', 'success');
  }

  renameGroup(groupId: string, newName: string) {
    if (!newName.trim()) throw new Error('分组名称不能为空');
    
    const groups = dataState.groups.map(g => 
      g.id === groupId ? { ...g, name: newName.trim() } : g
    );
    dataState.setGroups(groups);
    appState.showToast('分组已重命名', 'success');
  }

  deleteGroup(groupId: string) {
    const groups = dataState.groups.filter(g => g.id !== groupId);
    dataState.setGroups(groups);
    appState.showToast('分组已删除', 'success');
  }

  updateGroupOrder(newGroups: Group[]) {
    dataState.setGroups(newGroups);
  }

  saveSite(groupId: string, siteData: Partial<Site>) {
    const { name, url, icon, id } = siteData;
    
    if (!name?.trim() || !url?.trim()) {
      throw new Error('名称和链接不能为空');
    }

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const groups = [...dataState.groups];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) throw new Error('分组不存在');

    const group = { ...groups[groupIndex] };
    const newSite: Site = {
      id: id || crypto.randomUUID(),
      name: name.trim(),
      url: finalUrl,
      icon: icon?.trim() || ''
    };

    if (id) {
      group.sites = group.sites.map(s => s.id === id ? newSite : s);
    } else {
      group.sites = [...group.sites, newSite];
    }

    groups[groupIndex] = group;
    dataState.setGroups(groups);
    appState.showToast('站点已保存', 'success');
  }

  deleteSite(groupId: string, siteId: string) {
    const groups = dataState.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, sites: g.sites.filter(s => s.id !== siteId) };
      }
      return g;
    });
    dataState.setGroups(groups);
    appState.showToast('站点已删除', 'success');
  }

  moveSite(siteId: string, fromGroupId: string, toGroupId: string, newIndex: number) {
    const groups = JSON.parse(JSON.stringify(dataState.groups));
    
    const fromGroup = groups.find((g: Group) => g.id === fromGroupId);
    const toGroup = groups.find((g: Group) => g.id === toGroupId);
    
    if (!fromGroup || !toGroup) return;

    const siteIndex = fromGroup.sites.findIndex((s: Site) => s.id === siteId);
    if (siteIndex === -1) return;

    const [site] = fromGroup.sites.splice(siteIndex, 1);
    toGroup.sites.splice(newIndex, 0, site);

    dataState.setGroups(groups);
  }

  updateSiteOrder(groupId: string, newSites: Site[]) {
    const groups = dataState.groups.map(g => 
      g.id === groupId ? { ...g, sites: newSites } : g
    );
    dataState.setGroups(groups);
  }

  exportData() {
    const data: NavData = { groups: dataState.groups };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nav-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    appState.showToast('备份已下载', 'success');
  }

  async importData(file: File) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json.groups)) throw new Error('无效的备份文件');
      
      dataState.setGroups(json.groups);
      appState.showToast('数据已恢复', 'success');
    } catch (e) {
      appState.showToast('导入失败：文件格式错误', 'error');
    }
  }
}

export const manager = new DataManager();