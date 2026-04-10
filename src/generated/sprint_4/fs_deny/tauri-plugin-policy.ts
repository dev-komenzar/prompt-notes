// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `fs` プラグイン `deny`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd generate --sprint 4 --task 4-1
// @trace: detail:component_architecture §4.1, design:system-design §2.1

/**
 * Tauri plugin security policy definitions.
 *
 * These constants represent the mandatory deny/allow settings
 * for tauri.conf.json plugin scopes as specified in the
 * component architecture (§4.1 Tauri IPC セキュリティ設定).
 *
 * - fs: deny        → All file operations via #[tauri::command] only
 * - shell: deny     → No external process execution
 * - http: deny      → No network communication (privacy constraint)
 * - clipboard-manager: not used → Clipboard API (browser standard) instead
 */

export const TAURI_PLUGIN_POLICY = {
  fs: 'deny',
  shell: 'deny',
  http: 'deny',
  'clipboard-manager': 'not-used',
} as const;

export type PluginName = keyof typeof TAURI_PLUGIN_POLICY;
export type PolicyValue = (typeof TAURI_PLUGIN_POLICY)[PluginName];

/**
 * Describes why each plugin policy is set.
 */
export const POLICY_RATIONALE: Record<PluginName, string> = {
  fs: 'WebView からの直接ファイルアクセスを遮断。全ファイル操作は #[tauri::command] 経由。',
  shell: '外部プロセス起動を禁止。',
  http: 'ネットワーク通信を禁止。PromptNotes はネットワーク通信を一切行わない。',
  'clipboard-manager':
    'Clipboard API（ブラウザ標準 navigator.clipboard.writeText()）で代替。Tauri プラグイン不使用。',
};
