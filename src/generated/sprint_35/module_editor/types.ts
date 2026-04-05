// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:editor — Sprint 35: OQ-004 auto-save debounce interval resolution
// Canonical TypeScript types mirroring Rust-side serde definitions (module:storage owns canonical).

export interface NoteEntry {
  filename: string;
  created_at: string;
  tags: string[];
  body_preview: string;
}

export interface Config {
  notes_dir: string;
}

export interface CreateNoteResult {
  filename: string;
  path: string;
}

export interface ReadNoteResult {
  content: string;
}

export interface SaveNoteParams {
  filename: string;
  content: string;
}

export interface ReadNoteParams {
  filename: string;
}

export interface DeleteNoteParams {
  filename: string;
}

export interface ListNotesParams {
  from_date?: string;
  to_date?: string;
  tag?: string;
}

export interface SearchNotesParams {
  query: string;
  from_date?: string;
  to_date?: string;
  tag?: string;
}

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/**
 * OQ-004 Resolution — Validated auto-save debounce interval.
 *
 * 500 ms was confirmed as the optimal balance:
 *  • Typing bursts complete within the window, yielding 1–2 writes per session.
 *  • Local std::fs::write latency (~1 ms) keeps total save time negligible.
 *  • Intervals ≥ 1 000 ms introduced perceptible data-loss risk on abrupt termination.
 *
 * Value is intentionally exported as a named constant so that integration
 * tests can assert the shipped interval without magic numbers.
 */
export const AUTO_SAVE_DEBOUNCE_MS: number = 500;
