// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `tauri::Builder` 初期化
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md
// sprint: 5, task: 5-1, module: shell

/**
 * Exhaustive list of all 8 Tauri IPC command names registered
 * in generate_handler! macro (module:shell).
 *
 * This serves as the single source of truth for command name strings
 * on the frontend side, preventing typos in invoke() calls.
 */
export const TauriCommands = {
  CREATE_NOTE: 'create_note',
  SAVE_NOTE: 'save_note',
  READ_NOTE: 'read_note',
  LIST_NOTES: 'list_notes',
  SEARCH_NOTES: 'search_notes',
  DELETE_NOTE: 'delete_note',
  GET_SETTINGS: 'get_settings',
  UPDATE_SETTINGS: 'update_settings',
} as const;

export type TauriCommandName = (typeof TauriCommands)[keyof typeof TauriCommands];
