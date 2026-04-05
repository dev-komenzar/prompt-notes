// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:4 task:4-1 module:shell file:index.ts
// Barrel export for module:shell.
// This module provides the IPC boundary layer between Svelte frontend and Rust backend.

// ── Types ─────────────────────────────────────────────────────────────
export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteArgs,
  ReadNoteArgs,
  DeleteNoteArgs,
  ListNotesArgs,
  SearchNotesArgs,
  SetConfigArgs,
  IpcCommandName,
  IpcCommandMap,
} from './types';

// ── API (sole IPC entry point) ────────────────────────────────────────
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

// ── IPC internals ─────────────────────────────────────────────────────
export { IpcError } from './ipc';

// ── Debounce utility ──────────────────────────────────────────────────
export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';

// ── Filename validation ───────────────────────────────────────────────
export {
  isValidFilename,
  assertValidFilename,
  FilenameValidationError,
} from './filename-validator';

// ── Date utilities ────────────────────────────────────────────────────
export {
  formatDateForIpc,
  defaultDateRange,
  filenameTimestampToDisplay,
} from './date-utils';

// ── Frontmatter utilities ─────────────────────────────────────────────
export {
  FRONTMATTER_TEMPLATE,
  detectFrontmatter,
  extractBody,
} from './frontmatter';
export type { FrontmatterRange } from './frontmatter';

// ── Security: capability & FS access guard ────────────────────────────
export {
  MAIN_CAPABILITY,
  DENIED_PERMISSION_PREFIXES,
  validateCapability,
} from './capability';
export type { TauriCapability } from './capability';

export {
  installFsAccessGuards,
  FsAccessViolationError,
} from './fs-access-guard';
export type { GuardInstallResult } from './fs-access-guard';
