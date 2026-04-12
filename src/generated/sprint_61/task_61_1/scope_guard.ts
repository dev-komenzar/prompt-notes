// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 61-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:61 task:61-1
// @codd-sprint: 61
// @codd-task: 61-1

/**
 * Scope Guard — compile-time and runtime enforcement of prohibited features.
 * Any function in this module that is called indicates a scope violation.
 */

/**
 * Calling this function indicates a prohibited AI call feature has been implemented.
 * This must NEVER be called in production code. Presence of calls = release blocker.
 * RBC-SCOPE-1: AI呼び出し機能の実装禁止
 */
export function assertNoAiCall(): never {
  throw new Error(
    '[SCOPE VIOLATION] AI呼び出し機能はスコープ外です。実装禁止。RBC-SCOPE-1違反。',
  );
}

/**
 * Calling this function indicates a prohibited cloud sync feature.
 * RBC-SCOPE-1: クラウド同期機能の実装禁止
 */
export function assertNoCloudSync(): never {
  throw new Error(
    '[SCOPE VIOLATION] クラウド同期機能はスコープ外です。実装禁止。RBC-SCOPE-1違反。',
  );
}

/**
 * Calling this function indicates a prohibited Markdown rendering/preview feature.
 * RBC-EDITOR-1: Markdownプレビュー（レンダリング）禁止
 */
export function assertNoMarkdownPreview(): never {
  throw new Error(
    '[SCOPE VIOLATION] Markdownプレビュー（レンダリング）はスコープ外です。実装禁止。RBC-EDITOR-1違反。',
  );
}

/**
 * Calling this function indicates a prohibited title input field.
 * RBC-EDITOR-2: タイトル入力欄は禁止
 */
export function assertNoTitleInput(): never {
  throw new Error(
    '[SCOPE VIOLATION] タイトル入力欄はスコープ外です。実装禁止。RBC-EDITOR-2違反。',
  );
}

/**
 * Calling this function indicates a prohibited mobile-specific code path.
 * RBC-PLATFORM-1: モバイル対応はスコープ外
 */
export function assertNoMobileSupport(): never {
  throw new Error(
    '[SCOPE VIOLATION] モバイル対応はスコープ外です。実装禁止。RBC-PLATFORM-1違反。',
  );
}

/**
 * Runtime check: verifies that @tauri-apps/plugin-fs is NOT used directly in frontend code.
 * All file operations must go through ipc.ts wrappers → Rust backend.
 * RBC-TAURI-1: フロントエンドからの直接ファイルシステムアクセスを禁止
 */
export function assertNoDirectFsAccess(callerModule: string): void {
  throw new Error(
    `[IPC BOUNDARY VIOLATION] ${callerModule} が直接ファイルシステムアクセスを試みました。` +
      `全ファイル操作はRustバックエンド経由で行ってください。RBC-TAURI-1違反。`,
  );
}

/**
 * Runtime check: verifies that localStorage/sessionStorage/IndexedDB is NOT used for config storage.
 * Config must be persisted via Rust backend (invoke('set_config')).
 * RBC-SETTINGS-1: 設定変更（保存ディレクトリ）はRustバックエンド経由で永続化
 */
export function assertNoBrowserStorageForConfig(storageType: 'localStorage' | 'sessionStorage' | 'IndexedDB'): never {
  throw new Error(
    `[SETTINGS VIOLATION] ${storageType} への設定保存は禁止です。` +
      `invoke('set_config') 経由でRustバックエンドに永続化してください。RBC-SETTINGS-1違反。`,
  );
}

/**
 * Validates that the editor engine in use is CodeMirror 6.
 * RBC-EDITOR-1: CodeMirror 6 必須
 */
export function assertCodeMirror6(editorInstance: unknown): void {
  if (
    !editorInstance ||
    typeof editorInstance !== 'object' ||
    !('state' in editorInstance) ||
    !('dispatch' in editorInstance)
  ) {
    throw new Error(
      '[EDITOR VIOLATION] エディタエンジンが CodeMirror 6 ではありません。RBC-EDITOR-1違反。',
    );
  }
}
