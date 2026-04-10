// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: `#[cfg(target_os = "linux")]` で `~
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 12
// @task: 12-1
// Traceability: detail:component_architecture §3.4 設定永続化の所有権

/**
 * Settings type mirroring the Rust backend's Settings struct.
 * The canonical definition lives in Rust (module:settings).
 * This TypeScript type is a manual mirror and must stay in sync.
 */
export interface AppSettings {
  /** Custom notes directory path, or null if using OS default. */
  notes_dir: string;
}

/**
 * Result returned by update_settings IPC command.
 */
export interface UpdateSettingsResult {
  success: boolean;
}
