// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=50, task=50-1, module=all, resolves=OQ-006
// Public API barrel file for Sprint 50 error handling module.
// Exports all types, stores, handlers, and API wrappers needed by the application.

// ── Types ──
export type {
  ErrorSeverity,
  AppModule,
  AppError,
  ToastNotification,
  IpcResult,
  IpcSuccess,
  IpcFailure,
  AutoSaveStatus,
} from './types/errors';

export { StorageErrorCode } from './types/errors';

// ── Toast Store ──
export { toastStore } from './lib/toast-store';

// ── IPC Invocation ──
export { safeInvoke, invokeWithNotify } from './lib/ipc-safe-invoke';
export { extractIpcError } from './lib/ipc-error-extractor';

// ── Central Error Handler ──
export {
  handleError,
  handleAutoSaveError,
  registerSettingsNavigation,
} from './lib/error-handler';

// ── API Wrappers (with error handling) ──
export {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
  getConfig,
  setConfig,
} from './lib/api-error-wrapper';

export type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  Config,
  ListNotesParams,
  SearchNotesParams,
} from './lib/api-error-wrapper';

// ── Module-specific Error Handlers ──
export {
  createAutoSaveErrorHandler,
} from './modules/editor/autosave-error-handler';
export type { AutoSaveErrorHandler } from './modules/editor/autosave-error-handler';

export { copyToClipboardWithFeedback } from './modules/editor/clipboard-error-handler';

export {
  handleCreateNoteResult,
  handleReadNoteResult,
  handleDeleteNoteResult,
} from './modules/editor/editor-error-handler';

export {
  handleListNotesResult,
  handleSearchNotesResult,
  handleDeleteNoteFromGridResult,
} from './modules/grid/grid-error-handler';
export type { GridErrorState } from './modules/grid/grid-error-handler';

export {
  handleGetConfigResult,
  handleSetConfigResult,
} from './modules/settings/settings-error-handler';
export type { ConfigUpdateResult } from './modules/settings/settings-error-handler';

// ── Storage Error Contracts ──
export {
  RUST_ERROR_MESSAGE_CONTRACTS,
  ERROR_USER_MESSAGES,
} from './modules/storage/storage-error-codes';
