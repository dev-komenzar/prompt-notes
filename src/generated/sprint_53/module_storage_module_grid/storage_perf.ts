// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: `module:storage`, `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:53 task:53-1 module:storage milestone:パフォーマンス計測

/**
 * Performance-instrumented wrappers for module:storage IPC operations.
 *
 * These wrappers delegate to the actual Tauri IPC invoke calls while
 * measuring execution time. All file operations go through the Rust
 * backend via Tauri IPC — no direct filesystem access from frontend.
 *
 * Convention compliance:
 *   - CONV-3 (module:storage): Local .md file storage only, no DB/cloud
 *   - CONV-1 (framework:tauri): All file ops via Rust backend IPC
 *   - CONV-FILENAME: YYYY-MM-DDTHHMMSS.md format
 *   - CONV-AUTOSAVE: Auto-save mandatory
 */

import type { NoteEntry } from './types';
import { PerfTracker } from './perf_tracker';

/**
 * Arguments for list_notes IPC command.
 */
export interface ListNotesArgs {
  from_date?: string;
  to_date?: string;
  tag?: string;
}

/**
 * Arguments for search_notes IPC command.
 */
export interface SearchNotesArgs {
  query: string;
  from_date?: string;
  to_date?: string;
  tag?: string;
}

/**
 * Response from create_note IPC command.
 */
export interface CreateNoteResponse {
  filename: string;
  path: string;
}

/**
 * Response from read_note IPC command.
 */
export interface ReadNoteResponse {
  content: string;
}

/**
 * Tauri invoke function type. Accepts the actual invoke implementation
 * as a dependency to avoid direct import coupling and enable testing.
 */
export type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

/**
 * Create performance-instrumented storage API functions.
 *
 * @param invoke - The Tauri invoke function (from @tauri-apps/api/core or test mock)
 * @returns Object with instrumented storage operations
 *
 * Usage:
 *   import { invoke } from '@tauri-apps/api/core';
 *   const storage = createStoragePerfApi(invoke);
 *   const { filename } = await storage.createNote();
 */
export function createStoragePerfApi(invoke: InvokeFn) {
  const tracker = PerfTracker.getInstance();

  /**
   * Create a new note. Rust backend generates the YYYY-MM-DDTHHMMSS.md filename.
   * Convention: Frontend never generates filenames (CONV-FILENAME).
   */
  async function createNote(): Promise<CreateNoteResponse> {
    const { result } = await tracker.measureAsync(
      'storage',
      'create_note',
      () => invoke<CreateNoteResponse>('create_note'),
    );
    return result;
  }

  /**
   * Save note content. Auto-save calls this after 500ms debounce.
   * Convention: CONV-AUTOSAVE — no explicit save UI.
   *
   * @param filename - Must match ^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$ (validated Rust-side)
   * @param content - Full file content including frontmatter
   */
  async function saveNote(filename: string, content: string): Promise<void> {
    const { result } = await tracker.measureAsync(
      'storage',
      'save_note',
      () => invoke<void>('save_note', { filename, content }),
      { contentLength: content.length },
    );
    return result;
  }

  /**
   * Read a note's content by filename.
   *
   * @param filename - Must match the YYYY-MM-DDTHHMMSS.md pattern
   */
  async function readNote(filename: string): Promise<ReadNoteResponse> {
    const { result } = await tracker.measureAsync(
      'storage',
      'read_note',
      () => invoke<ReadNoteResponse>('read_note', { filename }),
      { filename },
    );
    return result;
  }

  /**
   * Delete a note by filename.
   *
   * @param filename - Must match the YYYY-MM-DDTHHMMSS.md pattern
   */
  async function deleteNote(filename: string): Promise<void> {
    const end = tracker.startMeasure('storage', 'delete_note');
    try {
      await invoke<void>('delete_note', { filename });
      end({ filename }, true);
    } catch (err) {
      end({ filename, error: err instanceof Error ? err.message : String(err) }, false);
      throw err;
    }
  }

  /**
   * List notes with optional date/tag filters.
   * Grid module calls this for initial 7-day default view and filter changes.
   *
   * @param args - Optional filters (from_date, to_date, tag)
   */
  async function listNotes(args?: ListNotesArgs): Promise<NoteEntry[]> {
    const { result } = await tracker.measureAsync(
      'storage',
      'list_notes',
      () => invoke<NoteEntry[]>('list_notes', args as Record<string, unknown> | undefined),
      {
        hasFromDate: args?.from_date !== undefined,
        hasToDate: args?.to_date !== undefined,
        hasTag: args?.tag !== undefined,
      },
    );
    return result;
  }

  /**
   * Full-text search across all notes (file scan, no index engine).
   * Rust backend performs str::to_lowercase().contains() matching.
   *
   * @param args - Search query and optional filters
   */
  async function searchNotes(args: SearchNotesArgs): Promise<NoteEntry[]> {
    const { result } = await tracker.measureAsync(
      'storage',
      'search_notes',
      () => invoke<NoteEntry[]>('search_notes', args as unknown as Record<string, unknown>),
      {
        queryLength: args.query.length,
        hasFromDate: args.from_date !== undefined,
        hasToDate: args.to_date !== undefined,
        hasTag: args.tag !== undefined,
      },
    );
    return result;
  }

  return {
    createNote,
    saveNote,
    readNote,
    deleteNote,
    listNotes,
    searchNotes,
  } as const;
}

/**
 * Type of the instrumented storage API.
 */
export type StoragePerfApi = ReturnType<typeof createStoragePerfApi>;
