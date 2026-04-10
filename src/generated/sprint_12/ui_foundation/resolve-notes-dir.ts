// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: `#[cfg(target_os = "linux")]` で `~
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 12
// @task: 12-1
// Traceability: detail:storage_fileformat §4.3 ディレクトリ解決ロジック
// Convention: module:storage, module:settings — 設定変更はRustバックエンド経由で永続化。
//   フロントエンド単独でのファイルパス操作は禁止。

import { getSettings } from './settings-api';
import { detectPlatform, getDefaultNotesDirForDisplay } from './storage-paths';

/**
 * Retrieve the currently active notes directory from the Rust backend.
 * This function calls the backend IPC and returns the resolved path.
 *
 * The Rust backend applies the following resolution logic:
 *   1. If a custom directory is configured, use it.
 *   2. Otherwise, use the OS-specific default:
 *      - Linux:  ~/.local/share/promptnotes/notes/
 *      - macOS:  ~/Library/Application Support/promptnotes/notes/
 *   3. If the resolved directory does not exist, create_dir_all is called
 *      to ensure it exists before any file operations.
 *
 * The frontend MUST NOT resolve paths locally. This function exists
 * as the single entry point for obtaining the notes directory info.
 */
export async function fetchResolvedNotesDir(): Promise<string> {
  const settings = await getSettings();
  return settings.notes_dir;
}

/**
 * Returns the default notes directory path string for display purposes only.
 * This is NOT the resolved path — use fetchResolvedNotesDir() for the actual value.
 * Intended for settings UI placeholder text.
 */
export function getDefaultNotesDirPlaceholder(): string {
  const platform = detectPlatform();
  return getDefaultNotesDirForDisplay(platform);
}
