/**
 * GitHub sync service. Handles data communication between local storage and GitHub.
 */

import { dataState } from '../core/data.svelte';
import { MESSAGES } from '../i18n';
import { GITHUB_ERRORS, GithubClient } from '../infra/github';
import type { GithubConfig } from '../types';

class SyncService {
  #abortController: AbortController | null = null;

  private get client() {
    return new GithubClient(dataState.config);
  }

  #nextSignal(): AbortSignal {
    this.#abortController?.abort();
    this.#abortController = new AbortController();
    return this.#abortController.signal;
  }

  #isAborted(e: unknown): boolean {
    return e instanceof DOMException && e.name === 'AbortError';
  }

  /**
   * Initial sync on app start or config change.
   * Compares SHA versions and pulls remote updates if available.
   */
  async init(): Promise<void> {
    if (!dataState.hasToken) {
      this.#abortController?.abort();
      this.#abortController = null;
      dataState.updateSyncState('idle');
      return;
    }

    const signal = this.#nextSignal();
    dataState.updateSyncState('checking');

    try {
      const remote = await this.client.getFile('profile.json', signal);

      if (!remote) {
        dataState.updateSyncState('success');
        if (dataState.groups.length > 0) {
          dataState.markDirty();
        }
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
        const wasDirty = dataState.isDirty;
        dataState.updateSyncState('success');
        if (wasDirty) {
          dataState.markDirty();
        }
      }
    } catch (e: unknown) {
      if (this.#isAborted(e)) return;
      console.error('Init sync failed:', e);
      dataState.updateSyncState('error', undefined, this.formatError(e));
    }
  }

  /**
   * Push local changes to GitHub with conflict check.
   */
  async push(): Promise<void> {
    if (!dataState.isDirty || !dataState.hasToken) return;

    const signal = this.#nextSignal();
    dataState.updateSyncState('syncing');

    try {
      const { sha } = await this.client.updateFile(
        'profile.json',
        { groups: dataState.groups },
        dataState.lastSha || undefined,
        signal
      );

      dataState.updateSyncState('success', sha);
    } catch (e: unknown) {
      if (this.#isAborted(e)) return;
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
   * Overwrite cloud data with local version, ignoring SHA conflicts.
   */
  async forcePush(): Promise<void> {
    const signal = this.#nextSignal();
    dataState.updateSyncState('syncing');
    try {
      const remote = await this.client.getFile('profile.json', signal);
      const baseSha = remote ? remote.sha : undefined;

      const { sha } = await this.client.updateFile(
        'profile.json',
        { groups: dataState.groups },
        baseSha,
        signal
      );

      dataState.updateSyncState('success', sha);
    } catch (e: unknown) {
      if (this.#isAborted(e)) return;
      dataState.updateSyncState('error', undefined, this.formatError(e));
      throw e;
    }
  }

  /**
   * Pull from remote and reset local state.
   */
  async resetToRemote(): Promise<void> {
    const signal = this.#nextSignal();
    dataState.updateSyncState('syncing');
    try {
      const remote = await this.client.getFile('profile.json', signal);
      if (remote) {
        const content = GithubClient.parseContent(remote.content);
        dataState.replaceData(content, remote.sha);
      } else {
        throw new Error(MESSAGES.TOAST.REMOTE_EMPTY);
      }
    } catch (e: unknown) {
      if (this.#isAborted(e)) return;
      dataState.updateSyncState('error', undefined, this.formatError(e));
      throw e;
    }
  }

  async updateConfig(config: GithubConfig) {
    dataState.updateConfig(config);
    await this.init();
  }

  async connectRepository(repoPath: string, token: string) {
    let parsed: { owner: string; repo: string };
    try {
      parsed = GithubClient.parseRepoPath(repoPath);
    } catch {
      throw new Error(MESSAGES.TOAST.CONFIG_FORMAT_ERROR);
    }
    await this.updateConfig({
      owner: parsed.owner,
      repo: parsed.repo,
      token
    });
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
