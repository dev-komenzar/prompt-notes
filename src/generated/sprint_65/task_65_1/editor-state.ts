// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=editor
// Editor state management: handles note lifecycle within the editor screen.
// Coordinates IPC calls for create, read, save operations.
// All file operations go through api.ts → Tauri IPC → module:storage (Rust).

import { createNote, readNote, saveNote } from "./api";
import { debounce, type DebouncedFn } from "./debounce";
import { createFrontmatterTemplate } from "./frontmatter";
import { assertValidNoteFilename } from "./filename-validator";
import { AUTOSAVE_DEBOUNCE_MS } from "./constants";

/**
 * Manages the editor's active note state and auto-save lifecycle.
 * One instance exists per Editor.svelte component lifetime.
 */
export class EditorNoteManager {
  private _currentFilename: string | null = null;
  private _debouncedSave: DebouncedFn<(content: string) => Promise<void>>;
  private _onError: (error: unknown) => void;

  constructor(onError: (error: unknown) => void = console.error) {
    this._onError = onError;
    this._debouncedSave = debounce(
      async (content: string) => {
        await this._saveCurrentNote(content);
      },
      AUTOSAVE_DEBOUNCE_MS,
    );
  }

  /** The filename of the currently active note, or null if no note is loaded. */
  get currentFilename(): string | null {
    return this._currentFilename;
  }

  /**
   * Creates a new note via IPC and returns the initial document content.
   * Called on Cmd+N / Ctrl+N (CONV-4).
   * Flushes any pending save for the previous note before creating.
   */
  async handleCreateNote(): Promise<{ filename: string; content: string }> {
    // Flush any pending auto-save for the current note
    this._debouncedSave.flush();

    const response = await createNote();
    this._currentFilename = response.filename;

    const content = createFrontmatterTemplate();
    // Trigger an immediate save of the template
    await saveNote(response.filename, content);

    return { filename: response.filename, content };
  }

  /**
   * Loads an existing note by filename.
   * Called when navigating from grid view to editor (CONV-GRID-3).
   * Flushes any pending save for the previous note before loading.
   */
  async handleLoadNote(filename: string): Promise<string> {
    assertValidNoteFilename(filename);

    // Flush any pending auto-save for the current note
    this._debouncedSave.flush();

    const response = await readNote(filename);
    this._currentFilename = filename;
    return response.content;
  }

  /**
   * Schedules an auto-save for the current document content.
   * Called by the CodeMirror updateListener on docChanged events.
   * Debounced at AUTOSAVE_DEBOUNCE_MS (500ms).
   */
  scheduleAutoSave(content: string): void {
    if (this._currentFilename === null) return;
    this._debouncedSave(content);
  }

  /**
   * Flushes any pending auto-save immediately.
   * Called on:
   *   - Note switch (before loading new note)
   *   - Component destroy (onDestroy)
   *   - Window close event
   */
  flushPendingSave(): void {
    this._debouncedSave.flush();
  }

  /**
   * Cancels any pending auto-save and resets state.
   * Called on component destroy.
   */
  destroy(): void {
    this._debouncedSave.flush();
    this._debouncedSave.cancel();
    this._currentFilename = null;
  }

  /** Internal: performs the actual save via IPC. */
  private async _saveCurrentNote(content: string): Promise<void> {
    if (this._currentFilename === null) return;
    try {
      await saveNote(this._currentFilename, content);
    } catch (err) {
      this._onError(err);
    }
  }
}
