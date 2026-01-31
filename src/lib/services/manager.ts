import { dataState } from '../core/data.svelte';
import { appState } from '../core/app.svelte';
import { MESSAGES } from '../i18n';

class DataManager {

  addGroup(name) {
    if (!name.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);
    const newGroup = { id: crypto.randomUUID(), name: name.trim(), sites: [] };
    dataState.setGroups([...dataState.groups, newGroup]);
    appState.showToast(MESSAGES.TOAST.GROUP_ADDED, 'success');
  }

  renameGroup(groupId, newName) {
    if (!newName.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);
    const groups = dataState.groups.map(g => g.id === groupId ? { ...g, name: newName.trim() } : g);
    dataState.setGroups(groups);
    appState.showToast(MESSAGES.TOAST.GROUP_RENAMED, 'success');
  }

  deleteGroup(groupId) {
    const groups = dataState.groups.filter(g => g.id !== groupId);
    dataState.setGroups(groups);
    appState.showToast(MESSAGES.TOAST.GROUP_DELETED, 'success');
  }

  updateGroupOrder(newGroups) {
    dataState.setGroups(newGroups);
  }

  swapGroups(sourceId, targetId) {
    const groups = [...dataState.groups];
    const srcIdx = groups.findIndex(g => g.id === sourceId);
    const tgtIdx = groups.findIndex(g => g.id === targetId);
    
    if (srcIdx === -1 || tgtIdx === -1 || srcIdx === tgtIdx) return;

    const [item] = groups.splice(srcIdx, 1);
    groups.splice(tgtIdx, 0, item);
    
    dataState.setGroups(groups);
  }

  moveSite(sourceId, targetId, targetGroupId) {
    const groups = JSON.parse(JSON.stringify(dataState.groups));
    
    let sourceSite;
    let sourceGroupIdx = -1;
    let sourceSiteIdx = -1;

    for (let i = 0; i < groups.length; i++) {
        const idx = groups[i].sites.findIndex(s => s.id === sourceId);
        if (idx !== -1) {
            sourceSite = groups[i].sites[idx];
            sourceGroupIdx = i;
            sourceSiteIdx = idx;
            break;
        }
    }

    if (!sourceSite || sourceGroupIdx === -1) return;

    const targetGroupIdx = groups.findIndex(g => g.id === targetGroupId);
    if (targetGroupIdx === -1) return;

    groups[sourceGroupIdx].sites.splice(sourceSiteIdx, 1);

    const targetGroup = groups[targetGroupIdx];
    
    if (targetId) {
        const targetSiteIdx = targetGroup.sites.findIndex(s => s.id === targetId);
        if (targetSiteIdx !== -1) {
            targetGroup.sites.splice(targetSiteIdx, 0, sourceSite);
        } else {
            targetGroup.sites.push(sourceSite);
        }
    } else {
        targetGroup.sites.push(sourceSite);
    }

    dataState.setGroups(groups);
  }

  saveSite(groupId, siteData) {
    const { name, url, icon, id } = siteData;
    if (!name?.trim() || !url?.trim()) throw new Error(MESSAGES.TOAST.SITE_INFO_REQUIRED);

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;

    const groups = JSON.parse(JSON.stringify(dataState.groups));
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) throw new Error(MESSAGES.TOAST.GROUP_NOT_FOUND);

    const group = groups[groupIndex];
    const newSite = {
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

  deleteSite(groupId, siteId) {
    const groups = dataState.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, sites: g.sites.filter(s => s.id !== siteId) };
      }
      return g;
    });
    dataState.setGroups(groups);
    appState.showToast(MESSAGES.TOAST.SITE_DELETED, 'success');
  }

  exportData() {
    const data = { groups: dataState.groups };
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

  async importData(file) {
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

export const manager = new DataManager();import { dataState } from '../core/data.svelte';
import { appState } from '../core/app.svelte';
import { MESSAGES } from '../i18n';

class DataManager {

  addGroup(name) {
    if (!name.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);
    const newGroup = { id: crypto.randomUUID(), name: name.trim(), sites: [] };
    dataState.setGroups([...dataState.groups, newGroup]);
    appState.showToast(MESSAGES.TOAST.GROUP_ADDED, 'success');
  }

  renameGroup(groupId, newName) {
    if (!newName.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);
    const groups = dataState.groups.map(g => g.id === groupId ? { ...g, name: newName.trim() } : g);
    dataState.setGroups(groups);
    appState.showToast(MESSAGES.TOAST.GROUP_RENAMED, 'success');
  }

  deleteGroup(groupId) {
    const groups = dataState.groups.filter(g => g.id !== groupId);
    dataState.setGroups(groups);
    appState.showToast(MESSAGES.TOAST.GROUP_DELETED, 'success');
  }

  updateGroupOrder(newGroups) {
    dataState.setGroups(newGroups);
  }

  swapGroups(sourceId, targetId) {
    const groups = [...dataState.groups];
    const srcIdx = groups.findIndex(g => g.id === sourceId);
    const tgtIdx = groups.findIndex(g => g.id === targetId);
    
    if (srcIdx === -1 || tgtIdx === -1 || srcIdx === tgtIdx) return;

    const [item] = groups.splice(srcIdx, 1);
    groups.splice(tgtIdx, 0, item);
    
    dataState.setGroups(groups);
  }

  moveSite(sourceId, targetId, targetGroupId) {
    const groups = JSON.parse(JSON.stringify(dataState.groups));
    
    let sourceSite;
    let sourceGroupIdx = -1;
    let sourceSiteIdx = -1;

    for (let i = 0; i < groups.length; i++) {
        const idx = groups[i].sites.findIndex(s => s.id === sourceId);
        if (idx !== -1) {
            sourceSite = groups[i].sites[idx];
            sourceGroupIdx = i;
            sourceSiteIdx = idx;
            break;
        }
    }

    if (!sourceSite || sourceGroupIdx === -1) return;

    const targetGroupIdx = groups.findIndex(g => g.id === targetGroupId);
    if (targetGroupIdx === -1) return;

    groups[sourceGroupIdx].sites.splice(sourceSiteIdx, 1);

    const targetGroup = groups[targetGroupIdx];
    
    if (targetId) {
        const targetSiteIdx = targetGroup.sites.findIndex(s => s.id === targetId);
        if (targetSiteIdx !== -1) {
            targetGroup.sites.splice(targetSiteIdx, 0, sourceSite);
        } else {
            targetGroup.sites.push(sourceSite);
        }
    } else {
        targetGroup.sites.push(sourceSite);
    }

    dataState.setGroups(groups);
  }

  saveSite(groupId, siteData) {
    const { name, url, icon, id } = siteData;
    if (!name?.trim() || !url?.trim()) throw new Error(MESSAGES.TOAST.SITE_INFO_REQUIRED);

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;

    const groups = JSON.parse(JSON.stringify(dataState.groups));
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) throw new Error(MESSAGES.TOAST.GROUP_NOT_FOUND);

    const group = groups[groupIndex];
    const newSite = {
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

  deleteSite(groupId, siteId) {
    const groups = dataState.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, sites: g.sites.filter(s => s.id !== siteId) };
      }
      return g;
    });
    dataState.setGroups(groups);
    appState.showToast(MESSAGES.TOAST.SITE_DELETED, 'success');
  }

  exportData() {
    const data = { groups: dataState.groups };
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

  async importData(file) {
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