// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Error-handling wrappers for all module:editor IPC calls.
// Policy table (editor_clipboard_design.md §4.7):
//
//   createNote  → abort; red banner 3 s
//   saveNote    → retry ×3 every 3 s; banner only after max retries exhausted
//   readNote    → red banner 3 s; caller resets NoteList selection
//   deleteNote  → abort; red banner 3 s; caller leaves NoteList unchanged
//   listNotes   → return empty list + loadFailed flag; NoteList shows "読み込み失敗"

import type { Note, NoteMetadata, NoteFilter } from '../../../lib/types';
import {
  createNote as ipcCreateNote,
  saveNote as ipcSaveNote,
  readNote as ipcReadNote,
  deleteNote as ipcDeleteNote,
  listNotes as ipcListNotes,
} from '../../../lib/ipc';
import { errorBannerStore } from './error_banner_store';
import { createSaveRetryManager, type SaveRetryManager } from './save_retry';

// ─── Localised error messages ─────────────────────────────────────────────────

const MSG_CREATE_FAILED = 'ノートの作成に失敗しました';
const MSG_SAVE_FAILED   = '保存に失敗しました（自動リトライ上限）';
const MSG_READ_FAILED   = 'ノートの読み込みに失敗しました';
const MSG_DELETE_FAILED = '削除に失敗しました';

// ─── createNote ───────────────────────────────────────────────────────────────

/**
 * Calls create_note.
 * On failure: logs to console and shows a 3-second red banner.
 * Returns null — caller must abort its state transition and leave the editor
 * in its current state.
 */
export async function handleCreateNote(): Promise<NoteMetadata | null> {
  try {
    return await ipcCreateNote();
  } catch (err) {
    console.error('[editor] createNote failed:', err);
    errorBannerStore.show(MSG_CREATE_FAILED);
    return null;
  }
}

// ─── saveNote (with retry) ────────────────────────────────────────────────────

/**
 * Creates a save-retry manager wired to the editor's error banner.
 *
 * Usage in EditorView.svelte:
 *
 *   const saveRetry = createEditorSaveRetryManager();
 *
 *   // inside debouncedSave():
 *   saveRetry.attempt(() => ipcSaveNote(currentNoteId, { tags }, body));
 *
 *   // onDestroy / on note switch:
 *   saveRetry.cancel();
 */
export function createEditorSaveRetryManager(): SaveRetryManager {
  return createSaveRetryManager(() => {
    errorBannerStore.show(MSG_SAVE_FAILED);
  });
}

// ─── readNote ─────────────────────────────────────────────────────────────────

export interface ReadNoteResult {
  note: Note | null;
  /**
   * True when the read failed.
   * Caller must reset NoteList selection to avoid a broken editing state.
   */
  failed: boolean;
}

/**
 * Calls read_note.
 * On failure: shows a 3-second red banner and returns { note: null, failed: true }.
 * Caller is responsible for resetting the NoteList selected state.
 */
export async function handleReadNote(id: string): Promise<ReadNoteResult> {
  try {
    const note = await ipcReadNote(id);
    return { note, failed: false };
  } catch (err) {
    console.error('[editor] readNote failed:', err);
    errorBannerStore.show(MSG_READ_FAILED);
    return { note: null, failed: true };
  }
}

// ─── deleteNote ───────────────────────────────────────────────────────────────

export interface DeleteNoteResult {
  /**
   * True when deletion succeeded.
   * Caller should remove the note from NoteList only when true.
   */
  success: boolean;
}

/**
 * Calls delete_note.
 * On failure: shows a 3-second red banner and returns { success: false }.
 * Caller must NOT modify the NoteList state when success is false.
 */
export async function handleDeleteNote(id: string): Promise<DeleteNoteResult> {
  try {
    await ipcDeleteNote(id);
    return { success: true };
  } catch (err) {
    console.error('[editor] deleteNote failed:', err);
    errorBannerStore.show(MSG_DELETE_FAILED);
    return { success: false };
  }
}

// ─── listNotes ────────────────────────────────────────────────────────────────

export interface ListNotesResult {
  notes: NoteMetadata[];
  /**
   * True when list retrieval failed.
   * NoteList component should render "読み込み失敗" text when true.
   * No red banner is shown for listNotes (design spec §4.7).
   */
  loadFailed: boolean;
}

/**
 * Calls list_notes.
 * On failure: returns an empty notes array with loadFailed=true.
 * No error banner is shown; the NoteList component displays "読み込み失敗".
 */
export async function handleListNotes(filter?: NoteFilter): Promise<ListNotesResult> {
  try {
    const notes = await ipcListNotes(filter);
    return { notes, loadFailed: false };
  } catch (err) {
    console.error('[editor] listNotes failed:', err);
    return { notes: [], loadFailed: true };
  }
}
