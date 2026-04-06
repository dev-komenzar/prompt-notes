// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 69-1
// @task-title: M1（M1-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:69 task:69-1 module:m1_m1_02
// CoDD trace: design:system-design (OQ-005 resolution), governance:adr_tech_stack
// Barrel export for sprint 69 M1-02 deliverables: Tauri v2 selection + IPC foundation

// Core shared types (mirrors Rust serde types)
export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesArgs,
  SearchNotesArgs,
  SaveNoteArgs,
  NoteFilenameArgs,
  SetConfigArgs,
  ViewState,
  SupportedPlatform,
} from './types';

// IPC command constants and type map
export { IPC_COMMANDS } from './ipc-commands';
export type { IpcCommandName, IpcCommandMap } from './ipc-commands';

// Type-safe IPC invoke wrappers (sole entry point for Tauri IPC)
export {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
  getConfig,
  setConfig,
} from './api';

// Platform detection
export { detectPlatform, modifierKeyLabel, defaultNotesDir } from './platform';

// Tauri v2 version selection decision (OQ-005 resolution)
export {
  TAURI_VERSION_SELECTION,
  REQUIRED_PLUGINS,
  EXCLUDED_PLUGINS,
} from './tauri-v2-selection';

// Capability/permission model
export { DEFAULT_CAPABILITY, validateCapabilityPermissions } from './capabilities';
export type { TauriCapability } from './capabilities';

// Debounce utility (auto-save + search)
export {
  createDebounce,
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
} from './debounce';

// Frontmatter utilities (display-only, authoritative parsing on Rust side)
export {
  detectFrontmatterRange,
  extractBody,
  NEW_NOTE_TEMPLATE,
  FILENAME_PATTERN,
} from './frontmatter';

// Date utilities (grid view 7-day default filter)
export {
  formatDateParam,
  defaultSevenDayRange,
  parseCreatedAt,
  formatCreatedAtDisplay,
} from './date-utils';
