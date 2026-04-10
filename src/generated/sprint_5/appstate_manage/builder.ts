// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-2
// @task-title: `AppState` の `manage()` 登録
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @task: 5-2 AppState の manage() 登録
// @module: module:shell

import { REGISTERED_COMMANDS } from './command-stubs';
import type { RegisteredCommand } from './command-stubs';
import type { AppState, AppStateConfig } from './app-state';
import { resolveDefaultNotesDir } from './app-state';

/**
 * TypeScript-side representation of the Tauri Builder initialization sequence.
 *
 * Rust equivalent:
 *
 * ```rust
 * fn main() {
 *     tauri::Builder::default()
 *         .manage(AppState::new())
 *         .invoke_handler(tauri::generate_handler![
 *             create_note,
 *             save_note,
 *             read_note,
 *             list_notes,
 *             search_notes,
 *             delete_note,
 *             get_settings,
 *             update_settings,
 *         ])
 *         .run(tauri::generate_context!())
 *         .expect("error while running tauri application");
 * }
 * ```
 */

export interface BuilderConfig {
  readonly appStateConfig?: AppStateConfig;
  readonly additionalCommands?: readonly string[];
}

function detectPlatform(): 'linux' | 'macos' {
  if (typeof navigator !== 'undefined') {
    const platform = navigator.platform.toUpperCase();
    if (platform.indexOf('MAC') >= 0) return 'macos';
  }
  return 'linux';
}

export function createAppState(config?: AppStateConfig): AppState {
  const platform = detectPlatform();
  const notesDir = config?.customNotesDir ?? resolveDefaultNotesDir(platform);
  return {
    notesDir,
    settings: { notes_dir: notesDir },
  };
}

export function getRegisteredCommands(): readonly RegisteredCommand[] {
  return REGISTERED_COMMANDS;
}

export function validateCommandRegistration(
  expectedCommands: readonly string[],
): { valid: boolean; missing: string[]; extra: string[] } {
  const registered = new Set<string>(REGISTERED_COMMANDS);
  const expected = new Set<string>(expectedCommands);

  const missing = expectedCommands.filter((cmd) => !registered.has(cmd));
  const extra = [...registered].filter((cmd) => !expected.has(cmd));

  return {
    valid: missing.length === 0 && extra.length === 0,
    missing,
    extra,
  };
}
