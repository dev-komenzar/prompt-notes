// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 74-1
// @task-title: M4（M4-04）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 74 · M4-04 · OQ-SF-002: body_preview 文字数上限
// Traceability: detail:storage_fileformat §3.4, detail:grid_search §1.2

/**
 * Mirrors the canonical Rust `NoteEntry` struct from `module:storage`.
 *
 * The Rust side (`models.rs`) is the single source of truth.
 * This TypeScript definition MUST stay in sync.
 */
export interface NoteEntry {
  /** e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-8601 local datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /**
   * First N characters of the note body (frontmatter excluded).
   * N = BODY_PREVIEW_MAX_LENGTH (200).
   * Truncated with ellipsis when the original body exceeds N chars.
   */
  readonly body_preview: string;
}

/** Configuration accepted by the body-preview extractor. */
export interface BodyPreviewConfig {
  /** Maximum character count for the preview (default: 200). */
  readonly maxLength: number;
  /** String appended on truncation (default: "…"). */
  readonly ellipsis: string;
}
