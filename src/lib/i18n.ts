export const MESSAGES = {
  // 通用界面元素
  UI: {
    SAVE: '保存',
    CONFIRM: '确定',
    CANCEL: '取消',
    COMPLETE: '完成',
    RESET: '重置',
    EDIT: '编辑',
    DELETE: '删除',
    SEARCH_PLACEHOLDER: 'Search...',
    LOADING: '同步中...',
    WAITING: '正在连接...',
    SAVE_AND_SYNC: '保存并同步',
    CHECK_CONFIG: '检查配置',
    CONFIRM_ACTION: '确认操作',
    TIP_CONFIG_GITHUB: '请点击右上角配置 GitHub 连接',
    TIP_CONFIG_TOKEN: '配置 GitHub 以同步数据',
    TIP_ENTER_EDIT: '进入编辑模式',
    TIP_EXIT_EDIT: '退出编辑',
    TIP_SWITCH_THEME: '切换主题',
    TIP_DRAG_SORT: '拖动排序分组',
    TIP_RENAME_GROUP: '重命名分组',
    TIP_DELETE_GROUP: '删除分组',
    TIP_DELETE_SITE: '删除站点',
    NEW_GROUP: '新建分组',
    NEW_SITE: '新建站点',
  },
  
  // 弹窗表单相关
  MODAL: {
    CONFIG_TITLE: 'GitHub 配置',
    CONFIG_LABEL_REPO: '用户名 / 仓库名 (Owner/Repo)',
    CONFIG_LABEL_TOKEN: '个人访问令牌 (Token)',
    EXPORT_DATA: '导出数据',
    IMPORT_DATA: '导入数据',
    EXPORT_TITLE: '导出 JSON 备份',
    IMPORT_TITLE: '从 JSON 恢复',
    
    GROUP_TITLE_NEW: '新建分组',
    GROUP_TITLE_EDIT: '重命名分组',
    GROUP_PLACEHOLDER: '分组名称',
    
    SITE_TITLE_NEW: '新建站点',
    SITE_TITLE_EDIT: '编辑站点',
    SITE_NAME_PLACEHOLDER: '网站名称',
    SITE_URL_PLACEHOLDER: '链接地址 (例如 google.com)',
    SITE_ICON_PLACEHOLDER: '图标文件名 (可选)',
  },

  // 交互反馈 (Toast)
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
    UNKNOWN_ERROR: '发生未知错误',
    CONFIG_MISSING: '请先配置 GitHub Token',
    CONFIG_INCOMPLETE: '请填写完整信息',
    CONFIG_FORMAT_ERROR: '格式错误：用户名/仓库名',
    CONFIG_SAVED: '连接成功，配置已保存',
    GROUP_NAME_REQUIRED: '请输入分组名称',
    GROUP_RENAMED: '分组已重命名',
    GROUP_ADDED: '分组已添加',
    SITE_INFO_REQUIRED: '请填写名称和链接',
    SITE_PROTOCOL_ERROR: '仅支持 HTTP/HTTPS 协议',
    SITE_URL_ERROR: '无效的链接格式',
    SITE_SAVED: '站点已保存',
    SITE_DELETED: '站点已删除',
  },

  // 确认对话框
  CONFIRM: {
    CONFLICT: '云端数据已更新（版本冲突）。\n确定强制覆盖云端吗？（取消则请手动刷新页面）',
    RESTORE: '确定要覆盖当前所有数据吗？此操作不可撤销。',
    SYNC_CHANGES: '确定要同步当前修改到 GitHub 吗？',
    DISCARD_CHANGES: '确定丢弃修改并重置吗？',
    DELETE_SITE: '确定要删除这个站点吗？',
    DELETE_GROUP_PREFIX: '确定删除分组 "',
    DELETE_GROUP_SUFFIX: '" 及其所有站点吗？',
  },

  // 错误代码映射
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