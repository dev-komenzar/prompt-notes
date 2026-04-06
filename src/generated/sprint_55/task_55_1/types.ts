// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — 共有型定義 (Rust側canonical NoteEntry/Configに追従)

/**
 * NoteEntry — canonical owner: module:storage (Rust models.rs)
 * This TypeScript definition follows the Rust side.
 * Used in E2E tests to validate IPC response shapes.
 */
export interface NoteEntry {
  filename: string;       // "2026-04-04T143052.md"
  created_at: string;     // "2026-04-04T14:30:52" (parsed from filename)
  tags: string[];         // frontmatter tags field
  body_preview: string;   // first 200 chars of body
}

/**
 * Config — canonical owner: module:settings (Rust config.rs)
 * This TypeScript definition follows the Rust side.
 */
export interface Config {
  notes_dir: string;
}

/**
 * IPC command argument types — canonical owner: Rust #[tauri::command] functions
 */
export interface CreateNoteResponse {
  filename: string;
  path: string;
}

export interface SaveNoteArgs {
  filename: string;
  content: string;
}

export interface ReadNoteArgs {
  filename: string;
}

export interface ReadNoteResponse {
  content: string;
}

export interface DeleteNoteArgs {
  filename: string;
}

export interface ListNotesArgs {
  from_date?: string;
  to_date?: string;
  tag?: string;
}

export interface SearchNotesArgs {
  query: string;
  from_date?: string;
  to_date?: string;
  tag?: string;
}

export interface SetConfigArgs {
  notes_dir: string;
}

/**
 * Filename validation regex per CONV-FILENAME.
 * Pattern: YYYY-MM-DDTHHMMSS.md with optional _N suffix for collision avoidance.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * All IPC command names used by the application.
 * These are the only valid invoke targets per the component architecture.
 */
export const IPC_COMMANDS = [
  'create_note',
  'save_note',
  'read_note',
  'delete_note',
  'list_notes',
  'search_notes',
  'get_config',
  'set_config',
] as const;

export type IPCCommand = (typeof IPC_COMMANDS)[number];
