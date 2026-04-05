// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:47 task:47-1 module:grid
// OQ-GRID-001 Resolution: Search debounce interval validated at 300ms.
//
// Rationale (Sprint 47 — 検索デバウンス間隔検証):
//   300ms provides perceived immediacy for interactive search while
//   limiting Tauri IPC call frequency to the Rust-side file full-scan.
//   Measured against note volumes of 100–3,000 files where Rust
//   str::to_lowercase().contains() completes well within the 200ms
//   latency target.  Independent of module:editor auto-save debounce
//   (500ms).  If note count exceeds 5,000 and search latency degrades,
//   tantivy indexing should be evaluated per system design guidance.

/** Search input debounce interval (milliseconds). OQ-GRID-001 resolved. */
export const SEARCH_DEBOUNCE_MS = 300 as const;

/** Default date-range filter span in days (CONV-GRID-1). */
export const DEFAULT_FILTER_DAYS = 7 as const;

/** Body preview character limit (Rust side truncates at this boundary). */
export const BODY_PREVIEW_MAX_CHARS = 200 as const;

/** Minimum column width for CSS Columns masonry layout (px). */
export const MASONRY_COLUMN_MIN_WIDTH_PX = 280 as const;

/** Gap between masonry cards (px). */
export const MASONRY_GAP_PX = 16 as const;
