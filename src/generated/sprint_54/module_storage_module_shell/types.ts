// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: `module:storage`, `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=54, task=54-1, modules=storage+shell, node=detail:storage_fileformat,detail:component_architecture
// Canonical TypeScript types mirroring Rust-side serde definitions.
// Rust side (module:storage models.rs) is the source of truth.
// Do NOT add fields here without corresponding Rust-side changes.

/**
 * Represents a single note entry returned by list_notes / search_notes.
 * Canonical owner: module:storage (Rust models.rs)
 */
export interface NoteEntry {
  /** Filename including extension, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-8601-ish datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 chars of body text (Rust-side truncated) */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical owner: module:settings (Rust config.rs)
 */
export interface Config {
  /** Absolute path to the notes storage directory */
  readonly notes_dir: string;
}

// ── IPC Command Argument Types ──────────────────────────────────────

export interface CreateNoteResult {
  readonly filename: string;
  readonly path: string;
}

export interface SaveNoteArgs {
  readonly filename: string;
  readonly content: string;
}

export interface ReadNoteArgs {
  readonly filename: string;
}

export interface ReadNoteResult {
  readonly content: string;
}

export interface DeleteNoteArgs {
  readonly filename: string;
}

export interface ListNotesArgs {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

export interface SearchNotesArgs {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

export interface SetConfigArgs {
  readonly notes_dir: string;
}

// ── View Navigation Types ───────────────────────────────────────────

export type ViewName = 'editor' | 'grid' | 'settings';

export interface NavigationState {
  readonly currentView: ViewName;
  readonly selectedFilename: string | null;
}
