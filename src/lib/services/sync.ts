import { GithubClient } from '../infra/github';
import { dataState } from '../core/data.svelte';
import { appState } from '../core/app.svelte';
import type { NavData, GithubConfig } from '../types';

class SyncService {
  private get client() {
    return new GithubClient(dataState.config);
  }

  async init(): Promise<void> {
    if (!dataState.hasToken) {
      dataState.updateSyncState('idle');
      return;
    }

    dataState.updateSyncState('checking');

    try {
      const remote = await this.client.getFile();
      
      if (!remote) {
        dataState.updateSyncState('success');
        return;
      }

      const isRemoteNewer = remote.sha !== dataState.lastSha;

      if (isRemoteNewer) {
        const remoteContent = GithubClient.parseContent(remote.content);
        
        if (dataState.isDirty) {
          dataState.updateSyncState('conflict', remote.sha);
          console.warn('Conflict detected');
          
          appState.openConfirm({
            msg: '云端数据已有更新，且本地有未保存修改。是否强制覆盖云端数据？(取消则保留本地修改，但这会导致下次同步失败)',
            onConfirm: () => this.forcePush(),
          });
        } else {
          dataState.replaceData(remoteContent, remote.sha);
          appState.showToast('已同步云端最新数据', 'success');
        }
      } else {
        dataState.updateSyncState('success');
      }
    } catch (e: any) {
      console.error('Init sync failed:', e);
      dataState.updateSyncState('error', undefined, this.formatError(e));
    }
  }

  async push(): Promise<void> {
    if (!dataState.isDirty || !dataState.hasToken) return;

    dataState.updateSyncState('syncing');

    try {
      const { sha } = await this.client.updateFile(
        'bookmarks.json',
        { groups: dataState.groups },
        dataState.lastSha || undefined
      );

      dataState.updateSyncState('success', sha);
      appState.showToast('同步成功', 'success');
    } catch (e: any) {
      console.error('Push failed:', e);
      
      if (e.message === 'CONFLICT') {
        dataState.updateSyncState('conflict');
        appState.showToast('同步失败：云端版本冲突', 'error');
        await this.init(); 
      } else {
        dataState.updateSyncState('error', undefined, this.formatError(e));
        appState.showToast(`同步失败: ${this.formatError(e)}`, 'error');
      }
    }
  }

  async forcePush(): Promise<void> {
    dataState.updateSyncState('syncing');
    try {
      const remote = await this.client.getFile();
      const baseSha = remote ? remote.sha : undefined;

      const { sha } = await this.client.updateFile(
        'bookmarks.json',
        { groups: dataState.groups },
        baseSha
      );

      dataState.updateSyncState('success', sha);
      appState.showToast('强制覆盖成功', 'success');
    } catch (e: any) {
      dataState.updateSyncState('error', undefined, this.formatError(e));
      appState.showToast('强制覆盖失败', 'error');
    }
  }

  async resetToRemote(): Promise<void> {
    dataState.updateSyncState('syncing');
    try {
      const remote = await this.client.getFile();
      if (remote) {
        const content = GithubClient.parseContent(remote.content);
        dataState.replaceData(content, remote.sha);
        appState.showToast('已重置为云端版本', 'success');
      } else {
        throw new Error('云端无数据');
      }
    } catch (e: any) {
      appState.showToast('重置失败', 'error');
      dataState.updateSyncState('error', undefined, this.formatError(e));
    }
  }

  async updateConfig(config: GithubConfig) {
    dataState.updateConfig(config);
    await this.init();
  }

  private formatError(e: any): string {
    if (e.message === 'TOKEN_INVALID') return 'Token 无效';
    if (e.message === 'NOT_FOUND') return '仓库不存在';
    if (e.message === 'CONFLICT') return '版本冲突';
    return '网络或未知错误';
  }
}

export const sync = new SyncService();