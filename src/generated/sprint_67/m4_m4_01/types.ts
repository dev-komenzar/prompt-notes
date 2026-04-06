// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 67-1
// @task-title: M4（M4-01）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=67, task=67-1, module=grid, oq=OQ-003
// Decision: CSS Columns selected for Masonry layout.
// WebKitGTK (Linux) and WKWebView (macOS) both provide stable CSS Columns support.
// CSS Grid masonry (grid-template-rows: masonry) rejected — experimental Firefox-only.

/**
 * Note entry as returned by module:storage via Tauri IPC.
 * Canonical definition lives in Rust (models.rs); this TS type follows Rust.
 */
export interface NoteEntry {
  readonly filename: string;
  readonly created_at: string;
  readonly tags: readonly string[];
  readonly body_preview: string;
}

/** Breakpoint definition for responsive column counts. */
export interface MasonryBreakpoint {
  /** Minimum container width in px at which this breakpoint activates. */
  readonly minWidth: number;
  /** Number of columns to render at this breakpoint. */
  readonly columns: number;
}

/** Full configuration for the CSS Columns masonry layout. */
export interface MasonryLayoutConfig {
  /** Ordered list of breakpoints (ascending by minWidth). */
  readonly breakpoints: readonly MasonryBreakpoint[];
  /** Gap between columns in px. */
  readonly columnGap: number;
  /** Vertical spacing between cards in px. */
  readonly rowGap: number;
  /** Fallback column count when no breakpoint matches. */
  readonly fallbackColumns: number;
}

/** Resolved layout state for a given container width. */
export interface ResolvedMasonryLayout {
  readonly columns: number;
  readonly columnGap: number;
  readonly rowGap: number;
  readonly containerWidth: number;
}

/** Visual style tokens for a note card inside the masonry grid. */
export interface NoteCardStyleTokens {
  readonly borderRadius: string;
  readonly padding: string;
  readonly backgroundColor: string;
  readonly hoverBackgroundColor: string;
  readonly tagBadgeBg: string;
  readonly tagBadgeColor: string;
  readonly previewFontSize: string;
  readonly metaFontSize: string;
  readonly lineClamp: number | null;
}
