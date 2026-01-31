import { dataState } from '../core/data.svelte';
import { appState } from '../core/app.svelte';
import { MESSAGES } from '../i18n';
import type { Group, Site, NavData } from '../types';

class DataManager {

  addGroup(name: string) {
    if (!name.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);
    
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: name.trim(),
      sites: []
    };
    
    dataState.setGroups([...dataState.groups, newGroup]);
    appState.showToast(MESSAGES.TOAST.GROUP_ADDED, 'success');
  }

  renameGroup(groupId: string, newName: string) {
    if (!newName.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);
    
    const groups = dataState.groups.map(g => 
      g.id === groupId ? { ...g, name: newName.trim() } : g
    );
    dataState.setGroups(groups);
    appState.showToast(MESSAGES.TOAST.GROUP_RENAMED, 'success');
  }

  deleteGroup(groupId: string) {
    const groups = dataState.groups.filter(g => g.id !== groupId);
    dataState.setGroups(groups);
    appState.showToast(MESSAGES.TOAST.GROUP_DELETED, 'success');
  }

  updateGroupOrder(newGroups: Group[]) {
    dataState.setGroups(newGroups);
  }

  swapGroups(sourceId: string, targetId: string) {
    const groups = [...dataState.groups];
    const srcIdx = groups.findIndex(g => g.id === sourceId);
    const tgtIdx = groups.findIndex(g => g.id === targetId);
    
    if (srcIdx === -1 || tgtIdx === -1) return;

    const [removed] = groups.splice(srcIdx, 1);
    groups.splice(tgtIdx, 0, removed);
    
    dataState.setGroups(groups);
  }

  saveSite(groupId: string, siteData: Partial<Site>) {
    const { name, url, icon, id } = siteData;
    
    if (!name?.trim() || !url?.trim()) {
      throw new Error(MESSAGES.TOAST.SITE_INFO_REQUIRED);
    }

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const groups = [...dataState.groups];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) throw new Error(MESSAGES.TOAST.GROUP_NOT_FOUND);

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
    appState.showToast(MESSAGES.TOAST.SITE_SAVED, 'success');
  }

  deleteSite(groupId: string, siteId: string) {
    const groups = dataState.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, sites: g.sites.filter(s => s.id !== siteId) };
      }
      return g;
    });
    dataState.setGroups(groups);
    appState.showToast(MESSAGES.TOAST.SITE_DELETED, 'success');
  }

  moveSiteByTarget(sourceId: string, targetId: string | null, targetGroupId: string) {
    const groups = structuredClone(dataState.groups);
    
    let site: Site | undefined;
    
    for (const g of groups) {
      const idx = g.sites.findIndex(s => s.id === sourceId);
      if (idx !== -1) {
        [site] = g.sites.splice(idx, 1);
        break;
      }
    }
    
    if (!site) return;

    const toGroup = groups.find((g: Group) => g.id === targetGroupId);
    if (!toGroup) return;

    if (targetId) {
        const targetIndex = toGroup.sites.findIndex(s => s.id === targetId);
        if (targetIndex !== -1) {
            toGroup.sites.splice(targetIndex, 0, site);
        } else {
            toGroup.sites.push(site);
        }
    } else {
        toGroup.sites.push(site);
    }

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
    appState.showToast(MESSAGES.TOAST.BACKUP_DOWNLOADED, 'success');
  }

  async importData(file: File) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json.groups)) throw new Error(MESSAGES.TOAST.INVALID_BACKUP);
      
      dataState.setGroups(json.groups);
      appState.showToast(MESSAGES.TOAST.RESTORE_SUCCESS, 'success');
    } catch (e) {
      appState.showToast(MESSAGES.TOAST.IMPORT_FAIL_FORMAT, 'error');
    }
  }
}

export const manager = new DataManager();