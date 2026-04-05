// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:shell – Public API barrel export
// Sprint 3 – Tauri v2 (OQ-005 resolved)
//
// External modules (module:editor, module:grid, module:settings UI) import from here.
// ipc.ts is intentionally NOT exported — it is internal to module:shell.
// All IPC communication MUST go through the api.ts functions.

// Type definitions (IPC boundary contract)
export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
  AppView,
} from './types';

// IPC error types
export { IpcError, FilenameValidationError } from './errors';

// Validation utilities
export { isValidFilename, assertValidFilename } from './validation';

// Type-safe IPC API — the ONLY permitted way to call Tauri IPC
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

// Debounce utility
export { debounce } from './debounce';
export type { Debounced } from './debounce';

// Application lifecycle
export {
  initializeLifecycle,
  registerFlushCallback,
  flushPendingOperations,
} from './lifecycle';

// Date utilities for IPC contract
export { formatDateForIpc, parseFilenameTimestamp } from './date';
