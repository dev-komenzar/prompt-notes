// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 49-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:49 task:49-1 module:settings
// @trace design:system-design detail:component_architecture detail:storage_fileformat
// @convention CONV-2: settings persistence via Rust backend only

/**
 * Application configuration structure.
 * Canonical definition: module:settings Rust backend (config.rs).
 * TypeScript side follows Rust-side serde structure.
 */
export interface Config {
  /** Absolute path to the notes storage directory. */
  notes_dir: string;
}

/**
 * Possible views in the application SPA routing.
 * Used by App.svelte for conditional rendering.
 */
export type AppView = 'editor' | 'grid' | 'settings';
