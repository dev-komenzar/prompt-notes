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

// @generated-from: docs/detailed_design/component_architecture.md
// sprint: 5, task: 5-1, module: shell

/**
 * IPC Boundary validation utilities.
 *
 * Ensures that frontend code never bypasses the Tauri IPC layer
 * for filesystem operations. This module re-exports the canonical
 * API surface that components should use instead of raw invoke().
 */

export { createNote, saveNote, readNote, listNotes, searchNotes, deleteNote } from './api/notes';
export { getSettings, updateSettings } from './api/settings';

export type { NoteMetadata, NoteData, Frontmatter, CreateNoteResult, OperationResult } from './types/note';
export type { Settings, UpdateSettingsResult } from './types/settings';
export type { SearchParams } from './types/search';
export { TauriCommands } from './types/commands';
export type { TauriCommandName } from './types/commands';
