export const MESSAGES = {
  TOAST: {
    SYNC_SUCCESS: '同步成功',
    SYNC_FAIL_PREFIX: '同步失败: ',
    RESET_SUCCESS: '已重置为云端版本',
    RESET_FAIL: '重置失败',
    OVERWRITE_SUCCESS: '覆盖成功',
    OVERWRITE_FAIL_PREFIX: '覆盖失败: ',
    BACKUP_DOWNLOADED: '备份已下载',
    RESTORE_SUCCESS: '数据已恢复，请记得同步',
    INVALID_BACKUP: '无效的备份文件',
    UNKNOWN_ERROR: '发生未知错误'
  },
  CONFIRM: {
    CONFLICT: '云端数据已更新（版本冲突）。\n确定强制覆盖云端吗？（取消则请手动刷新页面）',
    RESTORE: '确定要覆盖当前所有数据吗？此操作不可撤销。'
  },
  ERRORS: {
    REPO_NOT_FOUND: '找不到该仓库，请检查“用户名/仓库名”是否正确',
    TOKEN_INVALID: 'Token 无效或已过期，请重新生成',
    CONFLICT: '云端数据已更新（版本冲突），请刷新或强制覆盖',
    PUSH_FAILED: '同步推送失败，请检查网络连接',
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    FORBIDDEN: 'API 调用受限或无权限 (403)',
    NOT_FOUND: '请求的资源不存在 (404)',
    SERVER_ERROR: '服务器响应错误'
  }
} as const;