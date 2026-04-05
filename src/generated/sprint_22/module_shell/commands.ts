// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=22, task=22-1, module=module:shell
// IPC command name registry. Each constant maps to a #[tauri::command] function
// registered in the Rust backend (module:shell main.rs).
// Owner: module:shell — dispatches to module:storage or module:settings.

/**
 * Exhaustive registry of all Tauri IPC command names.
 * These must match the Rust #[tauri::command] function names exactly.
 */
export const IPC_COMMANDS = {
  // module:storage commands
  CREATE_NOTE: 'create_note',
  SAVE_NOTE: 'save_note',
  READ_NOTE: 'read_note',
  DELETE_NOTE: 'delete_note',
  LIST_NOTES: 'list_notes',
  SEARCH_NOTES: 'search_notes',

  // module:settings commands
  GET_CONFIG: 'get_config',
  SET_CONFIG: 'set_config',
} as const;

/** Union type of all valid IPC command name strings */
export type IpcCommandName = (typeof IPC_COMMANDS)[keyof typeof IPC_COMMANDS];
