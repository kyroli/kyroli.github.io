import { dataState } from '../core/data.svelte';
import { MESSAGES } from '../i18n';

class DataManager {
  addGroup(name: string) {
    if (!name.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);
    
    dataState.groups.push({ 
      id: crypto.randomUUID(), 
      name: name.trim(), 
      sites: [] 
    });
  }

  renameGroup(groupId: string, newName: string) {
    if (!newName.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);
    
    const group = dataState.groups.find(g => g.id === groupId);
    if (group) {
      group.name = newName.trim();
    }
  }

  deleteGroup(groupId: string) {
    const index = dataState.groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
      dataState.groups.splice(index, 1);
    }
  }

  moveGroup(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    
    const srcIdx = dataState.groups.findIndex(g => g.id === sourceId);
    if (srcIdx === -1) return;
    
    const [group] = dataState.groups.splice(srcIdx, 1);
    
    if (targetId) {
        const tgtIdx = dataState.groups.findIndex(g => g.id === targetId);
        if (tgtIdx !== -1) {
            dataState.groups.splice(tgtIdx, 0, group);
        } else {
            dataState.groups.push(group);
        }
    } else {
        dataState.groups.push(group);
    }
  }

  moveSite(sourceId: string, targetId: string | null, targetGroupId: string) {
    let sourceGroup;
    let sourceSite;
    let sourceSiteIdx = -1;

    for (const group of dataState.groups) {
        const idx = group.sites.findIndex(s => s.id === sourceId);
        if (idx !== -1) {
            sourceGroup = group;
            sourceSiteIdx = idx;
            sourceSite = group.sites[idx];
            break;
        }
    }

    if (!sourceSite || !sourceGroup) return;

    const targetGroup = dataState.groups.find(g => g.id === targetGroupId);
    if (!targetGroup) return;

    sourceGroup.sites.splice(sourceSiteIdx, 1);

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
  }

  saveSite(groupId: string, siteData: { id?: string, name: string, url: string, icon: string, invert?: boolean }) {
    const { name, url, icon, id, invert } = siteData;
    if (!name?.trim() || !url?.trim()) throw new Error(MESSAGES.TOAST.SITE_INFO_REQUIRED);

    const cleanUrl = url.trim();
    new URL(cleanUrl);

    const group = dataState.groups.find(g => g.id === groupId);
    if (!group) throw new Error(MESSAGES.TOAST.GROUP_NOT_FOUND);

    if (id) {
      const site = group.sites.find(s => s.id === id);
      if (site) {
        site.name = name.trim();
        site.url = cleanUrl;
        site.icon = icon?.trim() || '';
        site.invert = invert ?? false;
      }
    } else {
      group.sites.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        url: cleanUrl,
        icon: icon?.trim() || '',
        invert: invert ?? false
      });
    }
  }

  deleteSite(groupId: string, siteId: string) {
    const group = dataState.groups.find(g => g.id === groupId);
    if (group) {
      const idx = group.sites.findIndex(s => s.id === siteId);
      if (idx !== -1) {
        group.sites.splice(idx, 1);
      }
    }
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
  }

  async importData(file: File) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json.groups)) throw new Error(MESSAGES.TOAST.INVALID_BACKUP);
      dataState.setGroups(json.groups);
    } catch (e) {
      throw new Error(MESSAGES.TOAST.IMPORT_FAIL_FORMAT);
    }
  }
}

export const manager = new DataManager();