// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:editor — EditorController: orchestrates CodeMirror 6, auto-save, keymaps, clipboard.
//
// Designed for consumption by a Svelte component:
//   onMount  → controller.mount(container)
//   onDestroy → await controller.destroy()
//
// No title input field. No Markdown preview. CodeMirror 6 only.

import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';

import { AUTO_SAVE_DEBOUNCE_MS, type AutoSaveStatus } from './types';
import { createNote, readNote } from './ipc';
import { AutoSaveManager, type AutoSaveStatusListener } from './auto-save';
import { createEditorExtensions } from './editor-extensions';
import { FRONTMATTER_TEMPLATE, cursorPositionAfterFrontmatter, extractBody } from './frontmatter';
import { copyTextToClipboard } from './clipboard';

export interface EditorControllerOptions {
  /** Override the validated debounce interval (default: AUTO_SAVE_DEBOUNCE_MS = 500). */
  autoSaveDebounceMs?: number;
  /** Called on every auto-save status transition. */
  onAutoSaveStatusChange?: AutoSaveStatusListener;
  /** Called when an unrecoverable error occurs (IPC failure etc.). */
  onError?: (error: unknown) => void;
}

export class EditorController {
  private view: EditorView | null = null;
  private autoSave: AutoSaveManager;
  private currentFilename: string | null = null;
  private unsubStatus: (() => void) | null = null;
  private options: EditorControllerOptions;

  constructor(options: EditorControllerOptions = {}) {
    this.options = options;
    this.autoSave = new AutoSaveManager(
      options.autoSaveDebounceMs ?? AUTO_SAVE_DEBOUNCE_MS,
    );

    if (options.onAutoSaveStatusChange) {
      this.unsubStatus = this.autoSave.onStatusChange(options.onAutoSaveStatusChange);
    }
  }

  // -------- Lifecycle --------

  /** Create the EditorView and mount it into `container`. */
  mount(container: HTMLElement): void {
    if (this.view) {
      this.view.destroy();
    }

    const extensions = createEditorExtensions({
      onDocChange: (content) => this.handleDocChange(content),
      onNewNote: () => {
        void this.createNewNote();
      },
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
   * Flush pending saves and tear down the editor.
   * Must be awaited in the component's onDestroy / beforeunload handler.
   */
  async destroy(): Promise<void> {
    await this.autoSave.destroy();
    if (this.unsubStatus) {
      this.unsubStatus();
      this.unsubStatus = null;
    }
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
    this.currentFilename = null;
  }

  // -------- Note operations --------

  /**
   * Create a new note via IPC, replace editor content with frontmatter template,
   * and focus the body area.
   *
   * Invoked by Mod-n keymap or external trigger (e.g. toolbar button).
   * @returns The new note's filename, or null on error.
   */
  async createNewNote(): Promise<string | null> {
    try {
      // Flush any pending save for the current note before switching.
      if (this.currentFilename && this.autoSave.isPending()) {
        await this.autoSave.flush();
      }

      const result = await createNote();
      this.currentFilename = result.filename;

      if (this.view) {
        const template = FRONTMATTER_TEMPLATE;
        const cursorPos = cursorPositionAfterFrontmatter(template);

        this.view.dispatch({
          changes: { from: 0, to: this.view.state.doc.length, insert: template },
          selection: { anchor: cursorPos },
        });
        this.view.focus();
      }

      return result.filename;
    } catch (err: unknown) {
      this.options.onError?.(err);
      return null;
    }
  }

  /**
   * Load an existing note into the editor.
   * Called when navigating from GridView to Editor.
   */
  async loadNote(filename: string): Promise<void> {
    try {
      // Flush current note first.
      if (this.currentFilename && this.autoSave.isPending()) {
        await this.autoSave.flush();
      }

      const { content } = await readNote({ filename });
      this.currentFilename = filename;

      if (this.view) {
        const cursorPos = cursorPositionAfterFrontmatter(content);
        this.view.dispatch({
          changes: { from: 0, to: this.view.state.doc.length, insert: content },
          selection: { anchor: cursorPos },
        });
        this.view.focus();
      }
    } catch (err: unknown) {
      this.options.onError?.(err);
    }
  }

  // -------- Copy --------

  /**
   * Copy the body text (frontmatter excluded) to the system clipboard.
   * This is the core UX — 1-click copy of prompt text.
   *
   * @returns true on success, false on failure.
   */
  async copyBodyToClipboard(): Promise<boolean> {
    const body = this.getBodyText();
    return copyTextToClipboard(body);
  }

  // -------- Accessors --------

  /** Full document text including frontmatter. */
  getFullText(): string {
    if (!this.view) return '';
    return this.view.state.doc.toString();
  }

  /** Body text only (frontmatter stripped). For clipboard copy per AC-ED-05. */
  getBodyText(): string {
    return extractBody(this.getFullText());
  }

  /** Currently loaded filename, or null if no note is loaded. */
  getCurrentFilename(): string | null {
    return this.currentFilename;
  }

  /** Current auto-save status. */
  getAutoSaveStatus(): AutoSaveStatus {
    return this.autoSave.getStatus();
  }

  /** Expose the underlying EditorView for advanced integrations (read-only intent). */
  getView(): EditorView | null {
    return this.view;
  }

  // -------- Internal --------

  private handleDocChange(content: string): void {
    if (!this.currentFilename) return;
    this.autoSave.schedule(this.currentFilename, content);
  }
}
