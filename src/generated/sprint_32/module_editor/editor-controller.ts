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

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard §2.2, detail:grid_search §4.4
// Sprint 32 core: Loading existing notes from grid navigation.
// CONV: All file ops via Tauri IPC (CONV-1). No direct FS access.

import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { createNote, saveNote, readNote } from "./api";
import { createDebounce } from "./debounce";
import {
  FRONTMATTER_TEMPLATE,
  getBodyStartPosition,
  extractBody,
} from "./frontmatter-template";
import { copyToClipboard } from "./clipboard";
import { buildEditorExtensions, createEditorState } from "./editor-extensions";
import type { EditorState as AppEditorState } from "./types";

/** Auto-save debounce interval (ms). OQ-004: may be tuned after user testing. */
const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * EditorController manages the CodeMirror 6 editor instance lifecycle,
 * auto-save, note loading (from grid navigation), and new note creation.
 *
 * Ownership: This controller owns the EditorView instance exclusively.
 * It is created on editor mount and destroyed on editor unmount.
 */
export class EditorController {
  private view: EditorView | null = null;
  private state: AppEditorState = {
    currentFilename: null,
    isDirty: false,
    isLoading: false,
  };
  private debouncedSave: ReturnType<typeof createDebounce<() => void>>;
  private extensions: Extension[];
  private onStateChange: ((state: AppEditorState) => void) | null = null;

  constructor() {
    this.debouncedSave = createDebounce(() => {
      this.performSave();
    }, AUTOSAVE_DEBOUNCE_MS);

    this.extensions = buildEditorExtensions(
      () => this.handleCreateNote(),
      () => this.handleDocChanged()
    );
  }

  /**
   * Mounts the CodeMirror 6 editor into the given DOM element.
   * Called from Svelte onMount lifecycle hook.
   */
  mount(container: HTMLElement): void {
    this.view = new EditorView({
      state: createEditorState("", this.extensions),
      parent: container,
    });
  }

  /**
   * Destroys the editor and flushes any pending auto-save.
   * Called from Svelte onDestroy lifecycle hook.
   */
  destroy(): void {
    // Flush pending auto-save before destroying
    this.debouncedSave.flush();

    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
  }

  /**
   * Sets a callback for state changes (loading, dirty, filename).
   */
  setStateChangeHandler(handler: (state: AppEditorState) => void): void {
    this.onStateChange = handler;
  }

  /**
   * Loads an existing note into the editor.
   * Sprint 32 core feature: called when navigating from grid view.
   *
   * Flow:
   * 1. Flush any pending save for the current note
   * 2. Call read_note IPC to get content from Rust backend
   * 3. Replace editor document with loaded content
   * 4. Focus the body area (after frontmatter)
   */
  async loadNote(filename: string): Promise<void> {
    if (!this.view) return;

    // Flush pending save for previous note before switching
    this.debouncedSave.flush();

    this.updateState({ isLoading: true, isDirty: false });

    try {
      const { content } = await readNote(filename);
      this.state.currentFilename = filename;

      // Replace entire document with loaded content
      this.view.dispatch({
        changes: {
          from: 0,
          to: this.view.state.doc.length,
          insert: content,
        },
      });

      // Position cursor at body start (after frontmatter)
      const bodyStart = getBodyStartPosition(content);
      this.view.dispatch({
        selection: { anchor: bodyStart },
      });

      this.view.focus();
      this.updateState({ isLoading: false, currentFilename: filename });
    } catch (error) {
      this.updateState({ isLoading: false });
      throw error;
    }
  }

  /**
   * Creates a new note via IPC and loads the empty template.
   * Triggered by Cmd+N / Ctrl+N keybinding.
   *
   * Flow:
   * 1. Flush pending save for current note
   * 2. Call create_note IPC (Rust generates YYYY-MM-DDTHHMMSS.md filename)
   * 3. Replace editor with frontmatter template
   * 4. Focus body area
   */
  async handleCreateNote(): Promise<void> {
    if (!this.view) return;

    // Flush pending save for current note
    this.debouncedSave.flush();

    try {
      const { filename } = await createNote();
      this.state.currentFilename = filename;

      // Replace document with empty frontmatter template
      this.view.dispatch({
        changes: {
          from: 0,
          to: this.view.state.doc.length,
          insert: FRONTMATTER_TEMPLATE,
        },
      });

      // Position cursor at body start
      const bodyStart = getBodyStartPosition(FRONTMATTER_TEMPLATE);
      this.view.dispatch({
        selection: { anchor: bodyStart },
      });

      this.view.focus();
      this.updateState({
        currentFilename: filename,
        isDirty: false,
      });
    } catch (error) {
      // OQ-006: Error notification method TBD
      console.error("Failed to create note:", error);
      throw error;
    }
  }

  /**
   * Handles document changes from EditorView.updateListener.
   * Triggers debounced auto-save.
   */
  private handleDocChanged(): void {
    this.state.isDirty = true;
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
    this.debouncedSave.call();
  }

  /**
   * Performs the actual save via IPC.
   * Called by debounce timer (500ms after last edit).
   * CONV-AUTOSAVE: No explicit save button or Cmd+S needed.
   */
  private async performSave(): Promise<void> {
    if (!this.view || !this.state.currentFilename) return;

    const content = this.view.state.doc.toString();
    try {
      await saveNote(this.state.currentFilename, content);
      this.updateState({ isDirty: false });
    } catch (error) {
      // OQ-006: Error notification method TBD
      console.error("Auto-save failed:", error);
    }
  }

  /**
   * Copies the full document text to clipboard.
   * CONV: 1-click copy is core UX (RBC-1).
   *
   * @returns true if copy succeeded
   */
  async copyToClipboard(): Promise<boolean> {
    if (!this.view) return false;
    const text = this.view.state.doc.toString();
    return copyToClipboard(text);
  }

  /**
   * Copies only the body (excluding frontmatter) to clipboard.
   */
  async copyBodyToClipboard(): Promise<boolean> {
    if (!this.view) return false;
    const fullText = this.view.state.doc.toString();
    const body = extractBody(fullText);
    return copyToClipboard(body);
  }

  /**
   * Returns the current editor state.
   */
  getState(): Readonly<AppEditorState> {
    return { ...this.state };
  }

  /**
   * Returns the current document text, or empty string if no view.
   */
  getDocumentText(): string {
    if (!this.view) return "";
    return this.view.state.doc.toString();
  }

  /**
   * Returns the EditorView instance (read-only access for CopyButton).
   */
  getView(): EditorView | null {
    return this.view;
  }

  /**
   * Flushes any pending auto-save immediately.
   * Should be called before navigation away or window close.
   */
  flushPendingSave(): void {
    this.debouncedSave.flush();
  }

  private updateState(partial: Partial<AppEditorState>): void {
    Object.assign(this.state, partial);
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }
}
