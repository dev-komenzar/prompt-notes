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
 * IPC Command names — Single source of truth for Tauri invoke() command identifiers.
 * All file operations go through these IPC commands; direct filesystem access is prohibited.
 */
export const IPC_COMMANDS = {
  CREATE_NOTE: 'create_note',
  SAVE_NOTE: 'save_note',
  READ_NOTE: 'read_note',
  LIST_NOTES: 'list_notes',
  SEARCH_NOTES: 'search_notes',
  DELETE_NOTE: 'delete_note',
  GET_SETTINGS: 'get_settings',
  UPDATE_SETTINGS: 'update_settings',
} as const;

export type IpcCommandName = typeof IPC_COMMANDS[keyof typeof IPC_COMMANDS];
