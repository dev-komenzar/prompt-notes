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

// CoDD Trace: sprint=54, task=54-1, modules=storage+shell, node=detail:component_architecture
// IPC command name registry. All Tauri invoke() calls MUST use these constants.
// Direct string literals for command names are prohibited outside this file.

/** module:storage IPC commands — file CRUD, listing, search */
export const StorageCommands = {
  CREATE_NOTE: 'create_note',
  SAVE_NOTE: 'save_note',
  READ_NOTE: 'read_note',
  DELETE_NOTE: 'delete_note',
  LIST_NOTES: 'list_notes',
  SEARCH_NOTES: 'search_notes',
} as const;

/** module:settings IPC commands — config read/write */
export const SettingsCommands = {
  GET_CONFIG: 'get_config',
  SET_CONFIG: 'set_config',
} as const;

/** Union of all registered IPC command names for type-safe dispatch */
export type StorageCommandName = (typeof StorageCommands)[keyof typeof StorageCommands];
export type SettingsCommandName = (typeof SettingsCommands)[keyof typeof SettingsCommands];
export type IpcCommandName = StorageCommandName | SettingsCommandName;

/** Complete command registry for shell-level validation */
export const ALL_IPC_COMMANDS: readonly IpcCommandName[] = [
  ...Object.values(StorageCommands),
  ...Object.values(SettingsCommands),
] as const;
