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

// @generated-from: docs/detailed_design/component_architecture.md §2.3, §4.1
// Sprint 3 — module:shell: dialog:open のみを公開するラッパー

import { open as tauriDialogOpen } from '@tauri-apps/plugin-dialog';

/**
 * ディレクトリ選択ダイアログを開く。
 * @tauri-apps/plugin-dialog の `open` 関数のうち、ディレクトリ選択モードのみを
 * このモジュールから公開する。`save` ダイアログは capabilities で無効化されており、
 * このラッパーからも公開しない。
 *
 * 使用箇所: SettingsView.svelte（保存ディレクトリ変更）のみ。
 * フロントエンドは返却されたパス文字列を直接ファイル操作に使用してはならず、
 * invoke('set_config', { config: { notes_dir: path } }) 経由で Rust に渡すこと。
 *
 * @returns 選択されたディレクトリの絶対パス。キャンセル時は null。
 */
export async function openDirectoryDialog(): Promise<string | null> {
  const result = await tauriDialogOpen({
    directory: true,
    multiple: false,
    title: '保存ディレクトリを選択',
  });

  if (result === null || Array.isArray(result)) {
    return null;
  }
  return result;
}
