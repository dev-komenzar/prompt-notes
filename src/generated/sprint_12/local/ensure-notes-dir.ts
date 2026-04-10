// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-2
// @task-title: .local
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 12
// @task: 12-2
// @description: IPC wrapper for ensuring notes directory exists (create_dir_all equivalent)

import { invoke } from '@tauri-apps/api/core';
import type { ResolveNotesDirResult } from './resolve-notes-dir';

/**
 * Parameters sent to the Rust backend `resolve_notes_dir` command.
 * The backend handles:
 * 1. Reading current settings for custom directory
 * 2. Falling back to OS-specific default if no custom dir is set
 * 3. Calling `create_dir_all` if the directory does not exist
 */
export interface EnsureNotesDirParams {
  /** Optional override directory. When null/undefined, backend uses settings or OS default. */
  readonly customDir?: string | null;
}

/**
 * Backend response from the resolve_notes_dir IPC command.
 */
export interface EnsureNotesDirResponse {
  /** The resolved absolute path to the notes directory. */
  readonly notes_dir: string;
  /** Whether the directory was created (true) or already existed (false). */
  readonly created: boolean;
  /** The detected platform: "linux" or "macos". */
  readonly platform: string;
}

/**
 * Invokes the Rust backend to resolve and ensure the notes directory exists.
 *
 * This corresponds to the Rust-side logic:
 * ```rust
 * #[cfg(target_os = "linux")]
 * { home.join(".local/share/promptnotes/notes") }
 * #[cfg(target_os = "macos")]
 * { home.join("Library/Application Support/promptnotes/notes") }
 * ```
 *
 * When a custom directory is configured in settings, it takes priority.
 * If the resolved directory does not exist, `create_dir_all` is called.
 *
 * All file system operations are performed on the Rust backend.
 * The frontend never accesses the file system directly.
 */
export async function ensureNotesDir(
  params?: EnsureNotesDirParams,
): Promise<ResolveNotesDirResult> {
  const response = await invoke<EnsureNotesDirResponse>('resolve_notes_dir', {
    customDir: params?.customDir ?? null,
  });

  return {
    notesDir: response.notes_dir,
    created: response.created,
    platform: response.platform as ResolveNotesDirResult['platform'],
  };
}

/**
 * Invokes the Rust backend to ensure the notes directory exists using
 * the currently persisted settings (or OS default).
 * This is the typical call made during application startup.
 */
export async function ensureDefaultNotesDir(): Promise<ResolveNotesDirResult> {
  return ensureNotesDir();
}
