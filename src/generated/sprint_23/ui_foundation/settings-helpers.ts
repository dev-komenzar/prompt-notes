// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 23-1
// @task-title: `config.json` の読み書き。Linux: `~
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=23 task=23-1 module=settings
// Frontend-visible helpers for settings validation.
// Actual path resolution and persistence happen exclusively in Rust (module:settings).
// Frontend MUST NOT resolve or construct file paths; only validate user-supplied strings.

/** Returns true if the candidate string is a non-empty, non-whitespace path. */
export function isValidNotesDir(candidate: string): boolean {
  return candidate.trim().length > 0;
}

/**
 * Returns a validation error message, or null if valid.
 * Path existence / write-permission checks are performed server-side by Rust.
 */
export function validateNotesDir(candidate: string): string | null {
  if (!isValidNotesDir(candidate)) {
    return 'ディレクトリパスを入力してください。';
  }
  // Guard against the frontend accidentally assembling absolute paths with
  // directory traversal segments — Rust enforces this too, but fail early.
  if (candidate.includes('..')) {
    return 'パスに ".." を含めることはできません。';
  }
  return null;
}
