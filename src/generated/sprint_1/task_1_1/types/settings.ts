// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --sprint 1 --task 1-1

/**
 * Settings — Application settings.
 * Canonical owner: Rust backend settings management.
 * NNC-S4: Default notes_dir is OS-dependent. Changeable from settings UI.
 * All path resolution and persistence is Rust-backend only.
 */
export interface Settings {
  /** Notes storage directory path. Resolved and validated by Rust backend. */
  readonly notes_dir: string;
}

/**
 * UpdateSettingsResult — Return value of update_settings IPC command.
 */
export interface UpdateSettingsResult {
  readonly success: boolean;
}
