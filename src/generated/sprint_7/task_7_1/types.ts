// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 7-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=7 task=7-1 module=shared-layer
// Canonical TypeScript mirror of Rust-side serde types (module:storage models.rs, module:settings config.rs).
// Rust side is the source of truth; these definitions MUST track Rust struct changes.
// CI E2E tests verify structural parity across the IPC boundary.

/**
 * Represents a single note entry returned by `list_notes` / `search_notes` IPC commands.
 *
 * Canonical owner: module:storage (Rust `models.rs`).
 * Consumers: module:grid (card rendering), module:editor (create_note response).
 */
export interface NoteEntry {
  /** Note filename, e.g. "2026-04-04T143052.md". Immutable after creation. */
  readonly filename: string;

  /**
   * Creation timestamp derived from the filename (not from frontmatter).
   * Format: ISO-8601-like string, e.g. "2026-04-04T14:30:52".
   */
  readonly created_at: string;

  /** Tags extracted from YAML frontmatter `tags` field. Empty array when absent or on parse error. */
  readonly tags: readonly string[];

  /** First 200 characters of the note body (after frontmatter), used for grid card preview. */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in `config.json`.
 *
 * Canonical owner: module:settings (Rust `config.rs`).
 * Path:
 *   Linux : ~/.local/share/promptnotes/config.json
 *   macOS : ~/Library/Application Support/promptnotes/config.json
 */
export interface Config {
  /**
   * Absolute path to the notes storage directory.
   * Defaults:
   *   Linux : ~/.local/share/promptnotes/notes/
   *   macOS : ~/Library/Application Support/promptnotes/notes/
   *
   * Validated and persisted exclusively by the Rust backend (module:settings).
   * Frontend MUST NOT write this value to the filesystem directly.
   */
  readonly notes_dir: string;
}
