// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 76-1
// @task-title: M4（M4-05）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

/**
 * OQ-GRID-002 resolution: Tag filter type definitions supporting
 * both single-tag and multi-tag selection modes.
 *
 * module:grid — CONV-GRID-2 compliance: tag filter is a required feature.
 * IPC boundary: all filtering is delegated to module:storage (Rust backend).
 * Frontend constructs parameters only; no client-side filtering.
 */

/** Tag filter selection mode. */
export type TagFilterMode = 'single' | 'multi';

/**
 * Combinator for multi-tag mode.
 * - 'AND': note must contain ALL selected tags.
 * - 'OR':  note must contain at least ONE selected tag.
 */
export type MultiTagCombinator = 'AND' | 'OR';

/** Configuration for the tag filter behaviour. */
export interface TagFilterConfig {
  readonly mode: TagFilterMode;
  readonly combinator: MultiTagCombinator;
}

/** Immutable snapshot of the tag filter UI state. */
export interface TagFilterState {
  readonly config: TagFilterConfig;
  readonly selectedTags: readonly string[];
}

/**
 * Event payload dispatched by TagFilter UI on selection change.
 * Svelte: dispatch('tag-change', payload)
 */
export interface TagChangeEvent {
  readonly selectedTags: readonly string[];
  readonly mode: TagFilterMode;
  readonly combinator: MultiTagCombinator;
}

/**
 * NoteEntry as defined by module:storage (Rust canonical).
 * TypeScript side follows Rust definition — src/lib/types.ts is authoritative
 * for the frontend; re-exported here for co-location convenience.
 */
export interface NoteEntry {
  readonly filename: string;
  readonly created_at: string;
  readonly tags: readonly string[];
  readonly body_preview: string;
}

/**
 * Extended list_notes IPC parameters supporting multi-tag.
 *
 * Backward-compatible: when `mode === 'single'`, only `tag` is populated.
 * When `mode === 'multi'`, `tags` and `tags_combinator` are populated and
 * `tag` is left undefined.  The Rust backend must be updated to accept the
 * new fields for multi-tag mode to function (OQ-GRID-002 IPC change).
 */
export interface ListNotesParams {
  readonly from_date?: string;
  readonly to_date?: string;
  /** Single tag — backward-compatible with current module:storage IPC. */
  readonly tag?: string;
  /** Multiple tags — requires IPC extension on Rust side. */
  readonly tags?: readonly string[];
  /** Combinator for multi-tag filtering. Defaults to 'OR' if omitted. */
  readonly tags_combinator?: MultiTagCombinator;
}

/**
 * Extended search_notes IPC parameters supporting multi-tag.
 * Same backward-compatibility rules as ListNotesParams.
 */
export interface SearchNotesParams {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
  readonly tags?: readonly string[];
  readonly tags_combinator?: MultiTagCombinator;
}

/** Describes a single available tag and its occurrence count. */
export interface TagInfo {
  readonly name: string;
  readonly count: number;
}
