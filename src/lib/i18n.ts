/**
 * @description 国际化与全局文案管理字典。
 * 采用按业务场景模块化分类的静态对象管理模式。
 * 实现视图层(UI)与静态文案(Copywriting)的解耦，为后续多语言扩展和统一审校提供基础。
 */

export const MESSAGES = {
  /** * 基础交互文案 
   * 包含应用层级的通用标签、按钮文本及状态提示。
   */
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
    CONFIRM_ACTION: '操作确认',
    TIP_CONFIG_GITHUB: '请点击右上角设置 GitHub 连接',
    TIP_CONFIG_TOKEN: '请配置 GitHub 以开启同步',
    TIP_ENTER_EDIT: '进入编辑模式',
    TIP_EXIT_EDIT: '退出编辑',
    TIP_SWITCH_THEME: '切换明暗主题',
    TIP_DRAG_SORT: '按住拖拽可排序',
    TIP_RENAME_GROUP: '重命名',
    TIP_DELETE_GROUP: '删除分组',
    TIP_DELETE_SITE: '删除快捷方式',
    TIP_INVERT_ICON: '反色图标 (修复暗色模式下黑色图标不可见问题)',
    NEW_GROUP: '新建分组',
    NEW_SITE: '添加网站',
    GIT_COMMIT_MSG: 'update bookmarks via Kilonova',
  },
  
  /** * 模态框(Modal)专用文案 
   * 集中管理各类表单弹窗的标题、表单字段标签及占位符，保持组件内部逻辑高内聚。
   */
  MODAL: {
    CONFIG_TITLE: '连接 GitHub 数据源',
    CONFIG_LABEL_REPO: '仓库路径 (用户名/仓库名)',
    CONFIG_LABEL_TOKEN: '访问令牌 (Fine-grained PATs)',
    CONFIG_PLACEHOLDER_REPO: 'username/repo',
    CONFIG_PLACEHOLDER_TOKEN: 'ghp_...',
    EXPORT_DATA: '导出备份',
    IMPORT_DATA: '恢复备份',
    EXPORT_TITLE: '导出数据为 JSON',
    IMPORT_TITLE: '从 JSON 文件恢复',
    
    GROUP_TITLE_NEW: '新建分组',
    GROUP_TITLE_EDIT: '编辑分组名称',
    GROUP_PLACEHOLDER: '请输入分组名称...',
    
    SITE_TITLE_NEW: '添加新网站',
    SITE_TITLE_EDIT: '编辑网站信息',
    SITE_NAME_PLACEHOLDER: '网站标题 (如: Google)',
    SITE_URL_PLACEHOLDER: '网址 (如: https://www.google.com/)',
    SITE_ICON_PLACEHOLDER: '自定义图标名称 (可选)',
  },

  /** * 全局状态提示(Toast)文案 
   * 规范用户交互反馈（成功/异常/警告），统一系统消息的抛出格式。
   */
  TOAST: {
    SYNC_SUCCESS: '云端同步成功',
    RESET_SUCCESS: '本地数据已重置',
    FORCE_PUSH_SUCCESS: '已强制覆盖云端数据',
    BACKUP_DOWNLOADED: '备份文件已下载',
    RESTORE_SUCCESS: '数据已成功恢复',
    CONFIG_SAVED: 'GitHub 连接成功',
    GROUP_RENAMED: '分组名称已更新',
    GROUP_ADDED: '新分组已添加',
    GROUP_DELETED: '分组已删除',
    SITE_SAVED: '网站信息已保存',
    SITE_DELETED: '网站已删除',
    
    SYNC_FAIL_PREFIX: '同步中断: ',
    RESET_FAIL: '重置失败，请重试',
    FORCE_PUSH_FAIL: '强制覆盖失败，请检查网络',
    INVALID_BACKUP: '无效的备份文件，无法解析',
    IMPORT_FAIL_FORMAT: '导入失败：文件格式不正确',
    UNKNOWN_ERROR: '发生未知错误',
    CONFIG_MISSING: '请先完成 GitHub 连接配置',
    CONFIG_INCOMPLETE: '配置信息不完整',
    CONFIG_FORMAT_ERROR: '仓库路径格式错误 (应为: 用户/仓库)',
    GROUP_NAME_REQUIRED: '分组名称不能为空',
    SITE_INFO_REQUIRED: '标题和网址为必填项',
    SITE_PROTOCOL_ERROR: '仅支持 HTTP 或 HTTPS 协议',
    SITE_URL_ERROR: '网址格式不正确',
    GROUP_NOT_FOUND: '目标分组不存在',
    REMOTE_EMPTY: '云端仓库为空',
  },

  /** * 二次确认(Confirm)对话框文案 
   * 包含敏感操作的前置警告及支持动态变量注入的格式化文案。
   */
  CONFIRM: {
    CONFLICT_FORCE: '检测到云端数据更新，且本地有未保存的修改。\n\n是否强制将本地版本覆盖到云端？\n(注意：这将覆盖云端的最新更改)',
    RESTORE: '确定要用此备份覆盖当前所有数据吗？\n此操作不可撤销。',
    SYNC_CHANGES: '确定要将当前的修改推送到 GitHub 吗？',
    DISCARD_CHANGES: '确定要放弃所有未保存的修改并重置吗？',
    DELETE_SITE: '移除这个网站快捷方式？',
    /** * 基于高阶函数的动态文案：
     * 利用 TypeScript 实现严格的参数类型约束，替代基于正则匹配的传统模板字符串方案，降低运行时异常风险。
     */
    DELETE_GROUP: (name: string) => `确定删除分组 "${name}" 吗？\n组内的所有网站也会被移除。`,
  },

  /** * 服务端错误映射文案 
   * 专用于在数据层拦截底层 API 异常状态码，并将其转译为面向用户的可读提示。
   */
  ERRORS: {
    REPO_NOT_FOUND: '未找到指定仓库 (404)',
    TOKEN_INVALID: '访问令牌 (Token) 无效或过期',
    CONFLICT: '数据版本冲突',
    UNKNOWN: '未知网络错误'
  }
} as const;