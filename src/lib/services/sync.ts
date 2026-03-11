/**
 * @file sync.ts
 * @description GitHub 云端同步服务。负责本地数据与 GitHub 仓库的单双向通讯，
 * 封装了 SHA 校验、冲突检测(Conflict Resolution)、及状态机变更机制。
 */

import { GithubClient, GITHUB_ERRORS } from '../infra/github';
import { dataState } from '../core/data.svelte';
import { MESSAGES } from '../i18n';
import type { GithubConfig } from '../types';

class SyncService {
  private get client() {
    return new GithubClient(dataState.config);
  }

  /**
   * 应用启动或配置更改时的初始化同步
   * 将自动进行版本比对(SHA对比)，如发现云端有更新，会自动拉取。
   */
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
        const isFreshInstall = dataState.lastSha === '' && dataState.groups.length === 0;

        if (dataState.isDirty && !isFreshInstall) {
          dataState.updateSyncState('conflict', remote.sha);
        } else {
          dataState.replaceData(remoteContent, remote.sha);
        }
      } else {
        dataState.updateSyncState('success');
      }
    } catch (e: unknown) {
      console.error('Init sync failed:', e);
      dataState.updateSyncState('error', undefined, this.formatError(e));
    }
  }

  /**
   * 将本地修改推送到 GitHub (带防冲突检查)
   */
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
    } catch (e: unknown) {
      console.error('Push failed:', e);
      
      if (e instanceof Error && e.message === GITHUB_ERRORS.CONFLICT) {
        dataState.updateSyncState('conflict');
        await this.init(); 
      } else {
        dataState.updateSyncState('error', undefined, this.formatError(e));
        throw e;
      }
    }
  }

  /**
   * 强制将本地数据覆写至云端，无视 SHA 冲突
   */
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
    } catch (e: unknown) {
      dataState.updateSyncState('error', undefined, this.formatError(e));
      throw e;
    }
  }

  /**
   * 丢弃本地修改，强制从远程拉取并重置本地状态
   */
  async resetToRemote(): Promise<void> {
    dataState.updateSyncState('syncing');
    try {
      const remote = await this.client.getFile();
      if (remote) {
        const content = GithubClient.parseContent(remote.content);
        dataState.replaceData(content, remote.sha);
      } else {
        throw new Error(MESSAGES.TOAST.REMOTE_EMPTY);
      }
    } catch (e: unknown) {
      dataState.updateSyncState('error', undefined, this.formatError(e));
      throw e;
    }
  }

  async updateConfig(config: GithubConfig) {
    dataState.updateConfig(config);
    await this.init();
  }

  private formatError(e: unknown): string {
    if (e instanceof Error) {
        if (e.message === GITHUB_ERRORS.TOKEN_INVALID) return MESSAGES.ERRORS.TOKEN_INVALID;
        if (e.message === GITHUB_ERRORS.NOT_FOUND) return MESSAGES.ERRORS.REPO_NOT_FOUND;
        if (e.message === GITHUB_ERRORS.CONFLICT) return MESSAGES.ERRORS.CONFLICT;
    }
    return MESSAGES.ERRORS.UNKNOWN;
  }
}

export const sync = new SyncService();