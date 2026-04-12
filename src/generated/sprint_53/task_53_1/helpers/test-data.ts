// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 53
import * as path from 'path';
import * as os from 'os';

export const APP_BASE_URL = 'http://localhost:1420';

export const ROUTES = {
  EDITOR: '/',
  GRID: '/grid',
  SETTINGS: '/settings',
} as const;

export const COMMANDS = {
  CREATE_NOTE: 'create_note',
  SAVE_NOTE: 'save_note',
  READ_NOTE: 'read_note',
  DELETE_NOTE: 'delete_note',
  LIST_NOTES: 'list_notes',
  SEARCH_NOTES: 'search_notes',
  GET_CONFIG: 'get_config',
  SET_CONFIG: 'set_config',
} as const;

export function getDefaultNotesDir(): string {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'promptnotes', 'notes');
  }
  // Linux
  return path.join(os.homedir(), '.local', 'share', 'promptnotes', 'notes');
}

export const NOTES_DIR: string =
  process.env['PROMPTNOTES_TEST_NOTES_DIR'] ?? getDefaultNotesDir();

/** RB-3: ファイル名は YYYY-MM-DDTHHMMSS.md 形式に厳密に従う */
export const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;
export const NOTE_ID_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}$/;

export const AUTO_SAVE_DEBOUNCE_MS = 500;
export const SEARCH_DEBOUNCE_MS = 300;
export const DEBOUNCE_BUFFER_MS = 300;
export const NEW_NOTE_LATENCY_BUDGET_MS = 100;

// TypeScript interfaces matching Rust models.rs (field names are snake_case, serialised by Tauri IPC)
export interface NoteMetadata {
  id: string;
  tags: string[];
  created_at: string;
  preview: string; // 本文先頭 100 文字
}

export interface Note {
  id: string;
  frontmatter: { tags: string[] };
  body: string;
  created_at: string;
}

export interface NoteFilter {
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface AppConfig {
  notes_dir: string;
}

export const SAMPLE_BODY =
  'PromptNotes E2E lifecycle test body.\n\nSecond paragraph for multi-line verification.';
export const SAMPLE_TAGS = ['e2e', 'lifecycle'];
export const LIFECYCLE_SEARCH_QUERY = 'E2E lifecycle';

export const FRONTMATTER_ONLY_BODY_RE = /^---\n[\s\S]*?\n---\n?/;
