// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 30-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:30 | module:editor | CoDD trace: detail:editor_clipboard, detail:component_architecture

/**
 * Shared type definitions for module:editor and cross-module IPC boundaries.
 * Canonical source: module:storage (Rust side). TypeScript side follows Rust.
 */

export interface NoteEntry {
  filename: string;
  created_at: string;
  tags: string[];
  body_preview: string;
}

export interface Config {
  notes_dir: string;
}

export interface CreateNoteResponse {
  filename: string;
  path: string;
}

export interface ReadNoteResponse {
  content: string;
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
