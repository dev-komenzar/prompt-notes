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
// Traceability: detail:storage_fileformat §4.9 セキュリティ対策
// Convention: All path validation is performed on the Rust backend.
//   This module provides frontend-side input sanitation only.

/**
 * Lightweight client-side validation for notes directory input.
 * This does NOT replace Rust-side validation (existence check, write permissions,
 * symlink protection, create_dir_all). It only provides immediate UI feedback
 * for obviously invalid inputs before making an IPC call.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateNotesDirInput(path: string): ValidationResult {
  if (!path || path.trim().length === 0) {
    return { valid: false, error: 'ディレクトリパスを入力してください。' };
  }

  const trimmed = path.trim();

  if (!trimmed.startsWith('/') && !trimmed.startsWith('~')) {
    return { valid: false, error: '絶対パスまたは ~ で始まるパスを指定してください。' };
  }

  if (trimmed.includes('\0')) {
    return { valid: false, error: '無効な文字が含まれています。' };
  }

  return { valid: true };
}
