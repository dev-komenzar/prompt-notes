// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > design:system-design > detail:component_architecture

/**
 * Canonical frontend mirror of Rust-side NoteEntry (module:storage models.rs is authoritative).
 * Any drift from the Rust definition must be caught by CI E2E tests.
 */
export interface NoteEntry {
  readonly filename: string;
  readonly created_at: string;
  readonly tags: readonly string[];
  readonly body_preview: string;
}

/**
 * Application configuration persisted via module:settings (Rust backend).
 * Frontend never writes config.json directly — all mutations go through set_config IPC.
 */
export interface Config {
  readonly notes_dir: string;
}

/** Return type of the create_note IPC command. */
export interface CreateNoteResult {
  readonly filename: string;
  readonly path: string;
}

/** Return type of the read_note IPC command. */
export interface ReadNoteResult {
  readonly content: string;
}

/** Arguments accepted by list_notes IPC command. */
export interface ListNotesParams {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Arguments accepted by search_notes IPC command. */
export interface SearchNotesParams {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Arguments accepted by save_note IPC command. */
export interface SaveNoteParams {
  readonly filename: string;
  readonly content: string;
}

/** Arguments accepted by set_config IPC command. */
export interface SetConfigParams {
  readonly notes_dir: string;
}

/** Supported platforms — Windows is out of scope per conventions. */
export type SupportedPlatform = 'linux' | 'macos';

/** View discriminator used by App.svelte's currentView state. */
export type AppView = 'editor' | 'grid' | 'settings';

/**
 * Filename validation regex matching YYYY-MM-DDTHHMMSS(_N)?.md
 * Mirrors the Rust-side validation in module:storage.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/** Maximum body_preview length returned by module:storage. */
export const BODY_PREVIEW_MAX_CHARS = 200;

/** Default filter window in days for grid view (CONV-GRID-1). */
export const DEFAULT_FILTER_DAYS = 7;

/** Auto-save debounce interval in milliseconds. */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/** Search input debounce interval in milliseconds. */
export const SEARCH_DEBOUNCE_MS = 300;
