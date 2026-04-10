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

/**
 * Platform-specific default notes directory paths.
 * These constants mirror the Rust backend's resolve_notes_dir logic.
 * The frontend never resolves paths directly — these are for display/reference only.
 */
export const DEFAULT_NOTES_DIR_LINUX = '~/.local/share/promptnotes/notes/';
export const DEFAULT_NOTES_DIR_MACOS = '~/Library/Application Support/promptnotes/notes/';

export type SupportedPlatform = 'linux' | 'macos';

export function getDefaultNotesDirForDisplay(platform: SupportedPlatform): string {
  switch (platform) {
    case 'linux':
      return DEFAULT_NOTES_DIR_LINUX;
    case 'macos':
      return DEFAULT_NOTES_DIR_MACOS;
  }
}

export function detectPlatform(): SupportedPlatform {
  const ua = navigator.platform?.toUpperCase() ?? '';
  if (ua.indexOf('MAC') >= 0) {
    return 'macos';
  }
  return 'linux';
}
