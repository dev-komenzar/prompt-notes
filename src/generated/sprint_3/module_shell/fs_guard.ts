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

// @generated-from: docs/detailed_design/component_architecture.md §4.7 制約 1
// Sprint 3 — module:shell: フロントエンドからの直接 fs アクセスを構造的に禁止

/**
 * フロントエンドから @tauri-apps/plugin-fs を直接インポートしていないかを
 * 実行時に検出するガード。
 *
 * Tauri v2 のケイパビリティ設定で fs プラグインを無効化しているため、
 * 実際に呼び出してもエラーになるが、この関数によってより明確なエラーメッセージを
 * 開発時に提供する。
 *
 * ESLint カスタムルールと組み合わせて使用することで、
 * コンパイル前・実行前の 2 段階でガードする。
 *
 * @throws Error — 常に例外を throw する。直接 fs アクセスは禁止。
 */
export function assertNeverDirectFsAccess(callerHint: string): never {
  throw new Error(
    `[module:shell] 直接ファイルシステムアクセス禁止: ${callerHint}\n` +
      'すべてのファイル操作は src/lib/ipc.ts のラッパー関数経由で行うこと。\n' +
      '参照: docs/detailed_design/component_architecture.md §4.7 制約 1',
  );
}

/**
 * ESLint カスタムルール用の禁止インポートパターン。
 * .eslintrc または eslint.config.js の no-restricted-imports ルールに追加する。
 *
 * @example
 * // eslint.config.js
 * import { FS_FORBIDDEN_IMPORTS } from './src/generated/sprint_3/module_shell/fs_guard';
 * export default [
 *   {
 *     rules: {
 *       'no-restricted-imports': ['error', ...FS_FORBIDDEN_IMPORTS],
 *     },
 *   },
 * ];
 */
export const FS_FORBIDDEN_IMPORTS = [
  {
    name: '@tauri-apps/plugin-fs',
    message:
      'フロントエンドからの直接ファイルシステムアクセスは禁止。src/lib/ipc.ts のラッパーを使用すること。',
  },
  {
    name: '@tauri-apps/api/fs',
    message:
      'Tauri v1 の fs API は使用禁止。src/lib/ipc.ts のラッパーを使用すること。',
  },
] as const;
