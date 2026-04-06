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

// CoDD Trace: sprint=54, task=54-1, modules=storage+shell
// Barrel export for module:storage and module:shell TypeScript boundary layer.

// ── Types ───────────────────────────────────────────────────────────
export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  SaveNoteArgs,
  ReadNoteArgs,
  ReadNoteResult,
  DeleteNoteArgs,
  ListNotesArgs,
  SearchNotesArgs,
  SetConfigArgs,
  ViewName,
  NavigationState,
} from './types';

// ── IPC API (single entry point for all invoke calls) ───────────────
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

// ── IPC Command Registry ────────────────────────────────────────────
export { StorageCommands, SettingsCommands, ALL_IPC_COMMANDS } from './ipc-commands';
export type { StorageCommandName, SettingsCommandName, IpcCommandName } from './ipc-commands';

// ── Security Validators ─────────────────────────────────────────────
export {
  assertValidFilename,
  isValidFilename,
  assertValidDirectoryPath,
  assertValidDateFilter,
  sanitizeSearchQuery,
} from './security';

// ── Filename Utilities ──────────────────────────────────────────────
export {
  parseDateFromFilename,
  formatCreatedAt,
  formatDateFilter,
  getDefault7DayWindow,
  formatDisplayDate,
} from './filename-utils';

// ── Debounce ────────────────────────────────────────────────────────
export { debounce, AUTOSAVE_DEBOUNCE_MS, SEARCH_DEBOUNCE_MS } from './debounce';
export type { DebouncedFn } from './debounce';

// ── Storage Constants ───────────────────────────────────────────────
export {
  BODY_PREVIEW_MAX_CHARS,
  DEFAULT_FILTER_DAYS,
  FRONTMATTER_DELIMITER,
  EMPTY_FRONTMATTER_TEMPLATE,
  extractBodyFromContent,
  extractFrontmatterYaml,
} from './storage-constants';

// ── Platform ────────────────────────────────────────────────────────
export { detectPlatform, getModifierKeyLabel, getShortcutLabel } from './platform';
export type { SupportedPlatform } from './platform';

// ── Errors ──────────────────────────────────────────────────────────
export {
  IpcError,
  FilenameValidationError,
  PathValidationError,
  StorageError,
} from './errors';
