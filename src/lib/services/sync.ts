import { GithubClient, GITHUB_ERRORS } from '../infra/github';
import { dataState } from '../core/data.svelte';
import { appState } from '../core/app.svelte';
import { MESSAGES } from '../i18n';
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
            msg: MESSAGES.CONFIRM.CONFLICT_FORCE,
            onConfirm: () => this.forcePush(),
          });
        } else {
          dataState.replaceData(remoteContent, remote.sha);
          appState.showToast(MESSAGES.TOAST.SYNC_PULL_SUCCESS, 'success');
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
      appState.showToast(MESSAGES.TOAST.SYNC_SUCCESS, 'success');
    } catch (e: any) {
      console.error('Push failed:', e);
      
      if (e.message === GITHUB_ERRORS.CONFLICT) {
        dataState.updateSyncState('conflict');
        appState.showToast(MESSAGES.TOAST.SYNC_CONFLICT, 'error');
        await this.init(); 
      } else {
        dataState.updateSyncState('error', undefined, this.formatError(e));
        appState.showToast(`${MESSAGES.TOAST.SYNC_FAIL_PREFIX}${this.formatError(e)}`, 'error');
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
      appState.showToast(MESSAGES.TOAST.FORCE_PUSH_SUCCESS, 'success');
    } catch (e: any) {
      dataState.updateSyncState('error', undefined, this.formatError(e));
      appState.showToast(MESSAGES.TOAST.FORCE_PUSH_FAIL, 'error');
    }
  }

  async resetToRemote(): Promise<void> {
    dataState.updateSyncState('syncing');
    try {
      const remote = await this.client.getFile();
      if (remote) {
        const content = GithubClient.parseContent(remote.content);
        dataState.replaceData(content, remote.sha);
        appState.showToast(MESSAGES.TOAST.RESET_SUCCESS, 'success');
      } else {
        throw new Error(MESSAGES.TOAST.REMOTE_EMPTY);
      }
    } catch (e: any) {
      appState.showToast(MESSAGES.TOAST.RESET_FAIL, 'error');
      dataState.updateSyncState('error', undefined, this.formatError(e));
    }
  }

  async updateConfig(config: GithubConfig) {
    dataState.updateConfig(config);
    await this.init();
  }

  private formatError(e: any): string {
    if (e.message === GITHUB_ERRORS.TOKEN_INVALID) return MESSAGES.ERRORS.TOKEN_INVALID;
    if (e.message === GITHUB_ERRORS.NOT_FOUND) return MESSAGES.ERRORS.REPO_NOT_FOUND;
    if (e.message === GITHUB_ERRORS.CONFLICT) return MESSAGES.ERRORS.CONFLICT;
    return MESSAGES.ERRORS.UNKNOWN;
  }
}

export const sync = new SyncService();