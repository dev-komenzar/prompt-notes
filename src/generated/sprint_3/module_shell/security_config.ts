// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md §4.1, §4.7
// Sprint 3 — module:shell: CSP・fs 無効化・dialog:open のみ許可

/**
 * Tauri v2 の tauri.conf.json に設定すべき CSP 文字列。
 * - `default-src 'self'`: WebView 外部への通信を全面禁止
 * - `style-src 'self' 'unsafe-inline'`: Svelte の scoped CSS インライン適用を許可
 * - `script-src 'self'`: eval・インラインスクリプトを禁止
 * AI API・クラウドエンドポイントへの接続は CSP レベルで構造的にブロックされる。
 */
export const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost";

/**
 * tauri.conf.json の app.security セクションに設定する値。
 * CI/CD の設定検証スクリプトから参照することで設定の drift を検出できる。
 */
export const TAURI_SECURITY_CONFIG = {
  csp: CSP,
} as const;

/**
 * dialog プラグインの許可スコープ。
 * - open: true  — ディレクトリ選択ダイアログ（設定画面から保存先を変更するために必要）
 * - save: false — 保存ダイアログは不要（ノートは自動保存・Rust 側で管理）
 * - message/ask/confirm: false — 追加のダイアログ API は使用しない
 */
export const DIALOG_PLUGIN_CONFIG = {
  open: true,
  save: false,
  message: false,
  ask: false,
  confirm: false,
} as const;

/**
 * fs プラグインはフロントエンドに公開しない。
 * すべてのファイル操作は Rust バックエンドの #[tauri::command] 経由で行う。
 * この定数はコードレビューおよびリントルールの根拠として参照する。
 *
 * @see docs/detailed_design/component_architecture.md §4.7 制約 1
 */
export const FS_PLUGIN_ENABLED = false as const;

/**
 * tauri.conf.json の plugins セクション全体のリファレンス定義。
 * 実際の tauri.conf.json と diff を取ることで設定ずれを検出できる。
 *
 * @example
 * // src-tauri/tauri.conf.json
 * {
 *   "app": {
 *     "security": { "csp": "..." }
 *   },
 *   "plugins": {
 *     "dialog": { "open": true, "save": false }
 *   }
 * }
 */
export const TAURI_PLUGINS_CONFIG = {
  dialog: DIALOG_PLUGIN_CONFIG,
  // fs プラグインはエントリ自体を持たない（undefined = 無効）
} as const;

/**
 * module:shell が公開する IPC コマンド名の列挙。
 * フロントエンドはこの集合に含まれるコマンドのみ invoke できる。
 * 追加のコマンドを使用したい場合は Rust 側の #[tauri::command] 定義と
 * この列挙を同時に更新する必要がある。
 */
export const ALLOWED_IPC_COMMANDS = [
  'create_note',
  'save_note',
  'read_note',
  'delete_note',
  'list_notes',
  'search_notes',
  'get_config',
  'set_config',
] as const;

export type AllowedIpcCommand = (typeof ALLOWED_IPC_COMMANDS)[number];
