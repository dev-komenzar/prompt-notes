// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 17-1
// @task-title: パストラバーサル防止バリデーション（`filename` にパス区切り文字が含まれないことを検証）→ ファイル物理削除
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=17 task=17-1 module=storage

/**
 * Validates that a filename does not contain path separator characters.
 * Mirrors the path traversal prevention guard in src-tauri/src/storage/core.rs.
 */
export function validateFilename(filename: string): { valid: true } | { valid: false; reason: string } {
  if (filename.includes('/') || filename.includes('\\')) {
    return { valid: false, reason: 'filename must not contain path separator characters' };
  }
  if (filename.trim() === '') {
    return { valid: false, reason: 'filename must not be empty' };
  }
  return { valid: true };
}

/**
 * Throws if the filename fails path traversal validation.
 */
export function assertValidFilename(filename: string): void {
  const result = validateFilename(filename);
  if (!result.valid) {
    throw new Error(`Invalid filename: ${result.reason}`);
  }
}
