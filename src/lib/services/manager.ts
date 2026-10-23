import { dataState } from '../core/data.svelte';
import { MESSAGES } from '../i18n';
import type { NavData } from '../types';

class DataManager {
  addGroup(name: string) {
    if (!name.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);

    dataState.groups.push({
      id: crypto.randomUUID(),
      name: name.trim(),
      sites: []
    });
    dataState.markDirty();
  }

  renameGroup(groupId: string, newName: string) {
    if (!newName.trim()) throw new Error(MESSAGES.TOAST.GROUP_NAME_REQUIRED);

    const group = dataState.groups.find((g) => g.id === groupId);
    if (group) {
      group.name = newName.trim();
      dataState.markDirty();
    }
  }

  deleteGroup(groupId: string) {
    const index = dataState.groups.findIndex((g) => g.id === groupId);
    if (index !== -1) {
      dataState.groups.splice(index, 1);
      dataState.markDirty();
    }
  }

  moveGroup(sourceId: string, targetIndex: number) {
    const srcIdx = dataState.groups.findIndex((g) => g.id === sourceId);
    if (srcIdx === -1 || srcIdx === targetIndex) return;

    const [group] = dataState.groups.splice(srcIdx, 1);
    const clampedIdx = Math.max(0, Math.min(targetIndex, dataState.groups.length));
    dataState.groups.splice(clampedIdx, 0, group);
    dataState.markDirty();
  }

  moveSite(sourceId: string, targetGroupId: string, targetIndex: number) {
    const targetGroup = dataState.groups.find((g) => g.id === targetGroupId);
    if (!targetGroup) return;

    for (const group of dataState.groups) {
      const srcIdx = group.sites.findIndex((s) => s.id === sourceId);
      if (srcIdx !== -1) {
        if (group.id === targetGroupId && srcIdx === targetIndex) return;
        const [site] = group.sites.splice(srcIdx, 1);
        const clampedIdx = Math.max(0, Math.min(targetIndex, targetGroup.sites.length));
        targetGroup.sites.splice(clampedIdx, 0, site);
        dataState.markDirty();
        return;
      }
    }
  }

  saveSite(groupId: string, siteData: { id?: string; name: string; url: string; icon: string }) {
    const { name, url, icon, id } = siteData;
    if (!name?.trim() || !url?.trim()) throw new Error(MESSAGES.TOAST.SITE_INFO_REQUIRED);

    const cleanUrl = url.trim();
    if (!URL.canParse(cleanUrl)) throw new Error(MESSAGES.TOAST.SITE_URL_ERROR);
    const parsedUrl = new URL(cleanUrl);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error(MESSAGES.TOAST.SITE_PROTOCOL_ERROR);
    }

    const group = dataState.groups.find((g) => g.id === groupId);
    if (!group) throw new Error(MESSAGES.TOAST.GROUP_NOT_FOUND);

    if (id) {
      const site = group.sites.find((s) => s.id === id);
      if (site) {
        site.name = name.trim();
        site.url = cleanUrl;
        site.icon = icon?.trim() || '';
        dataState.markDirty();
      }
    } else {
      group.sites.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        url: cleanUrl,
        icon: icon?.trim() || ''
      });
      dataState.markDirty();
    }
  }

  deleteSite(groupId: string, siteId: string) {
    const group = dataState.groups.find((g) => g.id === groupId);
    if (group) {
      const idx = group.sites.findIndex((s) => s.id === siteId);
      if (idx !== -1) {
        group.sites.splice(idx, 1);
        dataState.markDirty();
      }
    }
  }

  async exportData(): Promise<boolean> {
    const data = { groups: dataState.groups };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const filename = `nav-backup-${new Date().toISOString().slice(0, 10)}.json`;

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (e: unknown) {
        // User cancelled the picker — fall through silently
        if (e instanceof DOMException && e.name === 'AbortError') return false;
        throw e;
      }
    }

    // Fallback for browsers without File System Access API
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  async importData(file: File) {
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      throw new Error(MESSAGES.TOAST.IMPORT_FAIL_FORMAT);
    }
    if (!json || typeof json !== 'object' || !Array.isArray((json as NavData).groups)) {
      throw new Error(MESSAGES.TOAST.INVALID_BACKUP);
    }
    dataState.setGroups((json as NavData).groups);
  }
}

export const manager = new DataManager();
