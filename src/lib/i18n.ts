/**
 * Internationalization and global message dictionary.
 */

const MESSAGES_EN = {
  UI: {
    APP_NAME: 'Kilonova',
    SUBTITLE: 'Personal Startpage',
    CONFIRM: 'Confirm',
    CANCEL: 'Cancel',
    COMPLETE: 'Complete',
    RESET: 'Reset',
    WAITING: 'Connecting...',
    SYNCING: 'Syncing',
    SAVE_AND_SYNC: 'Save & Sync',
    CHECK_CONFIG: 'Check Config',
    CONFIRM_ACTION: 'Confirm Action',
    TIP_CONFIG_GITHUB: 'Click the settings icon to connect GitHub',
    TIP_CONFIG_TOKEN: 'Configure GitHub to enable sync',
    TIP_ENTER_EDIT: 'Enter Edit Mode',
    TIP_EXIT_EDIT: 'Exit Edit Mode',
    TIP_SWITCH_THEME: 'Switch Theme',
    TIP_DRAG_SORT: 'Drag to reorder',
    TIP_RENAME_GROUP: 'Rename',
    TIP_DELETE_GROUP: 'Delete Group',
    TIP_DELETE_SITE: 'Delete Shortcut',
    TIP_INVERT_ICON: 'Invert Icon (Fix visibility for dark icons in dark mode)',
    NEW_GROUP: 'New Group',
    NEW_SITE: 'Add Site',
    GIT_COMMIT_MSG: 'update bookmarks via Kilonova',
    TIP_SWITCH_ENGINE: 'Switch Search Engine',
    SEARCH: 'Search',
    STATUS_OFFLINE: 'Offline Mode',
    STATUS_NO_CONFIG: 'Sync not configured',
    STATUS_SYNC_ERROR: 'Sync Error',
    STATUS_SYNCING: 'Syncing...',
    STATUS_UNSAVED: 'Unsaved changes',
    STATUS_SAVED: 'Data synced'
  },

  MODAL: {
    CONFIG_TITLE: 'Connect GitHub DataSource',
    CONFIG_LABEL_REPO: 'Repository (user/repo)',
    CONFIG_LABEL_TOKEN: 'Access Token (Fine-grained PATs)',
    CONFIG_PLACEHOLDER_REPO: 'username/repo',
    CONFIG_PLACEHOLDER_TOKEN: 'ghp_...',
    EXPORT_DATA: 'Export Backup',
    IMPORT_DATA: 'Restore Backup',
    EXPORT_TITLE: 'Export data to JSON',
    IMPORT_TITLE: 'Restore from JSON file',

    GROUP_TITLE_NEW: 'New Group',
    GROUP_TITLE_EDIT: 'Edit Group Name',
    GROUP_PLACEHOLDER: 'Enter group name...',

    SITE_TITLE_NEW: 'Add New Site',
    SITE_TITLE_EDIT: 'Edit Site Info',
    SITE_NAME_PLACEHOLDER: 'Site Title (e.g. Google)',
    SITE_URL_PLACEHOLDER: 'URL (e.g. https://www.google.com/)',
    SITE_ICON_PLACEHOLDER: 'Custom icon name (optional)'
  },

  TOAST: {
    SYNC_SUCCESS: 'Synced successfully',
    RESET_SUCCESS: 'Data reset',
    FORCE_PUSH_SUCCESS: 'Cloud data overwritten',
    BACKUP_DOWNLOADED: 'Backup file downloaded',
    RESTORE_SUCCESS: 'Data restored successfully',
    CONFIG_SAVED: 'GitHub connected',
    GROUP_RENAMED: 'Group name updated',
    GROUP_ADDED: 'New group added',
    GROUP_DELETED: 'Group deleted',
    SITE_SAVED: 'Site info saved',
    SITE_DELETED: 'Site deleted',

    SYNC_FAIL_PREFIX: 'Sync interrupted: ',
    RESET_FAIL: 'Reset failed, please try again',
    FORCE_PUSH_FAIL: 'Force push failed, check network',
    INVALID_BACKUP: 'Invalid backup file',
    IMPORT_FAIL_FORMAT: 'Import failed: incorrect format',
    UNKNOWN_ERROR: 'Unknown error occurred',
    CONFIG_MISSING: 'GitHub configuration required',
    CONFIG_INCOMPLETE: 'Incomplete configuration',
    CONFIG_FORMAT_ERROR: 'Invalid repository format (user/repo)',
    GROUP_NAME_REQUIRED: 'Group name is required',
    SITE_INFO_REQUIRED: 'Title and URL are required',
    SITE_PROTOCOL_ERROR: 'Only HTTP or HTTPS protocols are supported',
    SITE_URL_ERROR: 'Invalid URL format',
    GROUP_NOT_FOUND: 'Group not found',
    REMOTE_EMPTY: 'Remote repository is empty'
  },

  CONFIRM: {
    CONFLICT_FORCE:
      'Cloud data updated with unsaved local changes.\n\nForce overwrite cloud version?\n(Note: This will overwrite remote changes)',
    RESTORE:
      'Are you sure you want to overwrite all current data with this backup?\nThis action cannot be undone.',
    SYNC_CHANGES: 'Push current changes to GitHub?',
    DISCARD_CHANGES: 'Discard all unsaved changes and reset?',
    DELETE_SITE: 'Remove this website shortcut?',
    DELETE_GROUP: (name: string) => `Delete group "${name}" and all its sites?`
  },

  ERRORS: {
    REPO_NOT_FOUND: 'Repository not found (404)',
    TOKEN_INVALID: 'Invalid or expired Access Token',
    CONFLICT: 'Data version conflict',
    UNKNOWN: 'Unknown network error'
  }
};

const MESSAGES_ZH = {
  UI: {
    APP_NAME: 'Kilonova',
    SUBTITLE: 'Personal Startpage',
    CONFIRM: '确认',
    CANCEL: '取消',
    COMPLETE: '完成',
    RESET: '重置',
    WAITING: '连接中...',
    SYNCING: '同步中',
    SAVE_AND_SYNC: '保存并同步',
    CHECK_CONFIG: '检查配置',
    CONFIRM_ACTION: '确认操作',
    TIP_CONFIG_GITHUB: '点击设置图标连接 GitHub',
    TIP_CONFIG_TOKEN: '配置 GitHub 以启用同步',
    TIP_ENTER_EDIT: '进入编辑模式',
    TIP_EXIT_EDIT: '退出编辑模式',
    TIP_SWITCH_THEME: '切换主题',
    TIP_DRAG_SORT: '拖拽排序',
    TIP_RENAME_GROUP: '重命名',
    TIP_DELETE_GROUP: '删除分组',
    TIP_DELETE_SITE: '删除快捷方式',
    TIP_INVERT_ICON: '反转图标颜色 (修复深色模式下深色图标不可见问题)',
    NEW_GROUP: '新建分组',
    NEW_SITE: '添加网站',
    GIT_COMMIT_MSG: 'update bookmarks via Kilonova',
    TIP_SWITCH_ENGINE: '切换搜索引擎',
    SEARCH: '搜索',
    STATUS_OFFLINE: '离线模式',
    STATUS_NO_CONFIG: '未配置同步',
    STATUS_SYNC_ERROR: '同步错误',
    STATUS_SYNCING: '同步中...',
    STATUS_UNSAVED: '未保存的更改',
    STATUS_SAVED: '数据已同步'
  },

  MODAL: {
    CONFIG_TITLE: '连接 GitHub 数据源',
    CONFIG_LABEL_REPO: '仓库 (用户名/仓库名)',
    CONFIG_LABEL_TOKEN: '访问令牌 (Fine-grained PATs)',
    CONFIG_PLACEHOLDER_REPO: 'username/repo',
    CONFIG_PLACEHOLDER_TOKEN: 'ghp_...',
    EXPORT_DATA: '导出备份',
    IMPORT_DATA: '恢复备份',
    EXPORT_TITLE: '将数据导出为 JSON 文件',
    IMPORT_TITLE: '从 JSON 文件恢复数据',

    GROUP_TITLE_NEW: '新建分组',
    GROUP_TITLE_EDIT: '编辑分组名称',
    GROUP_PLACEHOLDER: '输入分组名称...',

    SITE_TITLE_NEW: '添加新网站',
    SITE_TITLE_EDIT: '编辑网站信息',
    SITE_NAME_PLACEHOLDER: '网站名称 (例如: Google)',
    SITE_URL_PLACEHOLDER: '网址 (例如: https://www.google.com/)',
    SITE_ICON_PLACEHOLDER: '自定义图标名称 (可选)'
  },

  TOAST: {
    SYNC_SUCCESS: '同步成功',
    RESET_SUCCESS: '数据已重置',
    FORCE_PUSH_SUCCESS: '已覆盖云端数据',
    BACKUP_DOWNLOADED: '备份文件已下载',
    RESTORE_SUCCESS: '数据恢复成功',
    CONFIG_SAVED: 'GitHub 已连接',
    GROUP_RENAMED: '分组名称已更新',
    GROUP_ADDED: '已添加新分组',
    GROUP_DELETED: '分组已删除',
    SITE_SAVED: '网站信息已保存',
    SITE_DELETED: '网站已删除',

    SYNC_FAIL_PREFIX: '同步中断：',
    RESET_FAIL: '重置失败，请重试',
    FORCE_PUSH_FAIL: '强制推送失败，请检查网络',
    INVALID_BACKUP: '无效的备份文件',
    IMPORT_FAIL_FORMAT: '导入失败：格式不正确',
    UNKNOWN_ERROR: '发生未知错误',
    CONFIG_MISSING: '需要配置 GitHub',
    CONFIG_INCOMPLETE: '配置不完整',
    CONFIG_FORMAT_ERROR: '无效的仓库格式 (用户名/仓库名)',
    GROUP_NAME_REQUIRED: '分组名称不能为空',
    SITE_INFO_REQUIRED: '标题和网址不能为空',
    SITE_PROTOCOL_ERROR: '仅支持 HTTP 或 HTTPS 协议',
    SITE_URL_ERROR: '无效的网址格式',
    GROUP_NOT_FOUND: '未找到分组',
    REMOTE_EMPTY: '远程仓库为空'
  },

  CONFIRM: {
    CONFLICT_FORCE:
      '云端数据已更新，且本地有未保存的更改。\n\n是否强制覆盖云端版本？\n(注意：这将覆盖远程的更改)',
    RESTORE: '确定要用此备份覆盖当前所有数据吗？\n此操作无法撤销。',
    SYNC_CHANGES: '将当前更改推送到 GitHub？',
    DISCARD_CHANGES: '放弃所有未保存的更改并重置？',
    DELETE_SITE: '移除此网站快捷方式？',
    DELETE_GROUP: (name: string) => `删除分组 "${name}" 及其所有网站？`
  },

  ERRORS: {
    REPO_NOT_FOUND: '未找到仓库 (404)',
    TOKEN_INVALID: '访问令牌无效或已过期',
    CONFLICT: '数据版本冲突',
    UNKNOWN: '未知网络错误'
  }
} as const satisfies typeof MESSAGES_EN;

export const MESSAGES =
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')
    ? MESSAGES_ZH
    : MESSAGES_EN;
