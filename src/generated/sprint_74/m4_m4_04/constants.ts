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
// Traceability: detail:storage_fileformat §4.3, detail:grid_search §4.3

/**
 * Maximum number of characters for `NoteEntry.body_preview`.
 *
 * Rationale (OQ-SF-002):
 *   200 characters provides 3–5 lines of visible text inside a
 *   Pinterest-style Masonry card at typical column widths (220–280 px).
 *   This balances information density with card-height variance so that
 *   the Masonry layout fills without excessive whitespace gaps.
 *
 * This constant is the single source of truth on the TypeScript side.
 * The Rust backend (`module:storage`) must use the identical value when
 * slicing `body_preview` in `list_notes` / `search_notes` responses.
 */
export const BODY_PREVIEW_MAX_LENGTH = 200 as const;

/**
 * Ellipsis character appended when the body text exceeds
 * BODY_PREVIEW_MAX_LENGTH and must be truncated.
 */
export const TRUNCATION_ELLIPSIS = "\u2026" as const; // …

/**
 * Minimum meaningful preview length.  If the body (after stripping
 * frontmatter) is shorter than this, it is returned as-is without
 * truncation — even if BODY_PREVIEW_MAX_LENGTH is smaller (which it
 * should never be, but the guard exists for defensive correctness).
 */
export const BODY_PREVIEW_MIN_LENGTH = 1 as const;
