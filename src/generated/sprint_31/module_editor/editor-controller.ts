// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 31-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint_31 task_31-1 module:editor
// Central controller for the editor module.
// Owns the EditorView lifecycle, auto-save debounce, and IPC coordination.
// All filesystem operations go through api.ts → Tauri IPC → module:storage.

import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { createEditorExtensions } from './editor-extensions';
import { createNote, saveNote, readNote } from './api';
import { debounce, type DebouncedFn } from './debounce';
import {
  FRONTMATTER_TEMPLATE,
  extractBodyText,
  getFrontmatterEndPosition,
} from './frontmatter-template';
import { copyToClipboard } from './clipboard';

const AUTOSAVE_DEBOUNCE_MS = 500;

export class EditorController {
  private view: EditorView | null = null;
  private currentFilename = '';
  private debouncedSave: DebouncedFn<(content: string) => Promise<void>>;
  private destroyed = false;

  constructor() {
    this.debouncedSave = debounce(async (content: string) => {
      if (this.currentFilename && !this.destroyed) {
        try {
          await saveNote(this.currentFilename, content);
        } catch (err) {
          console.error('[promptnotes] auto-save failed:', err);
        }
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  /**
   * Mounts the CodeMirror 6 EditorView into the given container element.
   */
  mount(container: HTMLElement): void {
    const extensions = createEditorExtensions({
      onCreateNewNote: () => this.handleCreateNewNote(),
      onDocChanged: (content: string) => this.handleDocChanged(content),
    });

    this.view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions,
      }),
      parent: container,
    });
  }

  /**
   * Destroys the EditorView and flushes any pending auto-save.
   */
  destroy(): void {
    this.destroyed = true;
    this.debouncedSave.flush();
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
  }

  getView(): EditorView | null {
    return this.view;
  }

  getCurrentFilename(): string {
    return this.currentFilename;
  }

  /**
   * Loads an existing note by filename. Flushes any pending save first.
   */
  async loadNote(filename: string): Promise<void> {
    this.debouncedSave.flush();
    try {
      const { content } = await readNote(filename);
      this.currentFilename = filename;
      this.replaceDocument(content);
      this.focusAfterFrontmatter();
    } catch (err) {
      console.error('[promptnotes] failed to load note:', err);
    }
  }

  /**
   * Creates a new note via IPC, replaces the editor content with the
   * frontmatter template, and focuses the body area.
   * Called by both the Cmd+N / Ctrl+N keybinding and external triggers.
   */
  async handleCreateNewNote(): Promise<void> {
    this.debouncedSave.flush();
    try {
      const { filename } = await createNote();
      this.currentFilename = filename;
      this.replaceDocument(FRONTMATTER_TEMPLATE);
      this.focusAfterFrontmatter();
    } catch (err) {
      console.error('[promptnotes] failed to create note:', err);
    }
  }

  /**
   * Copies body text (frontmatter excluded) to the system clipboard.
   * Returns true on success.
   */
  async copyBodyToClipboard(): Promise<boolean> {
    if (!this.view) return false;
    const bodyText = extractBodyText(this.view.state.doc.toString());
    return copyToClipboard(bodyText);
  }

  /**
   * Returns the full document text including frontmatter.
   */
  getFullDocumentText(): string {
    if (!this.view) return '';
    return this.view.state.doc.toString();
  }

  /**
   * Returns body text only (frontmatter excluded).
   */
  getBodyText(): string {
    return extractBodyText(this.getFullDocumentText());
  }

  /**
   * Flushes any pending debounced save immediately.
   * Useful for beforeunload / window close handling.
   */
  flushPendingSave(): void {
    this.debouncedSave.flush();
  }

  // -- private helpers -------------------------------------------------------

  private handleDocChanged(content: string): void {
    this.debouncedSave(content);
  }

  private replaceDocument(newContent: string): void {
    if (!this.view) return;
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: newContent,
      },
    });
  }

  private focusAfterFrontmatter(): void {
    if (!this.view) return;
    const content = this.view.state.doc.toString();
    const cursorPos = getFrontmatterEndPosition(content);
    this.view.dispatch({
      selection: { anchor: cursorPos },
    });
    this.view.focus();
  }
}
