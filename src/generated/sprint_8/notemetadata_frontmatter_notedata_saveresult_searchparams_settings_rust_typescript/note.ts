// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 8-1
// @task-title: `NoteMetadata`, `Frontmatter`, `NoteData`, `SaveResult`, `SearchParams`, `Settings` の Rust 正規定義と TypeScript ミラー型が一致する
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @traceability: sprint-8 task-8-1 — NoteMetadata, Frontmatter, NoteData, SaveResult TypeScript mirror types
// Canonical definitions: src-tauri/src/storage/types.rs (module:storage)

/**
 * Mirror of Rust `Frontmatter` struct.
 * YAML frontmatter containing only `tags`. Additional fields are preserved
 * during round-trip by the Rust backend but are not surfaced to the frontend.
 */
export interface Frontmatter {
  tags: string[];
}

/**
 * Mirror of Rust `NoteMetadata` struct.
 * Returned by `list_notes` and `search_notes` IPC commands.
 *
 * - `filename`:     e.g. "2026-04-10T091530.md" (immutable, acts as unique ID)
 * - `tags`:         extracted from YAML frontmatter
 * - `created_at`:   ISO 8601 datetime parsed from filename, e.g. "2026-04-10T09:15:30"
 * - `body_preview`: first N characters of the note body (truncated by Rust backend)
 */
export interface NoteMetadata {
  filename: string;
  tags: string[];
  created_at: string;
  body_preview: string;
}

/**
 * Mirror of Rust `NoteData` struct.
 * Returned by the `read_note` IPC command.
 */
export interface NoteData {
  metadata: NoteMetadata;
  body: string;
}

/**
 * Mirror of Rust `SaveResult` struct.
 * Returned by the `save_note` and `delete_note` IPC commands.
 */
export interface SaveResult {
  success: boolean;
}
