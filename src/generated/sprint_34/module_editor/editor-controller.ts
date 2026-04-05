// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 34-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:34 task:34-1 module:editor
// CoDD trace: detail:editor_clipboard → plan:implementation_plan
// EditorController owns the CM6 EditorView lifecycle.
// Convention 6: No title input field. Body-only editor.
// Convention 7: 1-click copy via copyBodyToClipboard().
// Convention 8: Cmd+N / Ctrl+N via CM6 keymap Mod-n.

import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  createEditorExtensions,
  type EditorExtensionsResult,
} from './extensions';
import { createNote, saveNote, readNote } from './api';
import {
  extractBodyText,
  generateFrontmatterTemplate,
  getBodyCursorPosition,
} from './frontmatter';
import { copyToClipboard } from './clipboard';
import type { ErrorHandler, EditorMountOptions } from './types';

/**
 * Manages the CodeMirror 6 editor lifecycle and coordinates
 * IPC operations (create, save, read) with the Rust backend.
 *
 * Svelte components instantiate this controller in onMount
 * and call destroy() in onDestroy.
 */
export class EditorController {
  private view: EditorView | null = null;
  private currentFilename: string | null = null;
  private extResult: EditorExtensionsResult | null = null;
  private errorHandler: ErrorHandler = () => {};
  private noteCreatedCb: ((filename: string) => void) | null = null;
  private saveStateCb: ((saving: boolean) => void) | null = null;
  private mounted = false;

  /**
   * Mounts the CM6 editor into a DOM container.
   * Must be called exactly once. Call destroy() before re-mounting.
   */
  mount(container: HTMLElement, options?: EditorMountOptions): void {
    if (this.mounted) {
      throw new Error(
        'EditorController already mounted. Call destroy() first.',
      );
    }

    this.errorHandler = options?.onError ?? (() => {});
    this.noteCreatedCb = options?.onNoteCreated ?? null;
    this.saveStateCb = options?.onSaveStateChange ?? null;
    this.currentFilename = options?.filename ?? null;

    this.extResult = createEditorExtensions({
      keybindingHandlers: {
        onCreateNote: () => {
          void this.handleCreateNote();
          return true;
        },
      },
      autoSaveConfig: {
        onSave: (content) => this.handleAutoSave(content),
        onSaveStart: () => this.saveStateCb?.(true),
        onSaveEnd: () => this.saveStateCb?.(false),
        onSaveError: (err) => this.errorHandler(err, 'auto-save'),
      },
    });

    const doc = options?.content ?? '';

    this.view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: this.extResult.extensions,
      }),
      parent: container,
    });

    this.mounted = true;

    if (options?.content && options?.filename) {
      const cursor = getBodyCursorPosition(doc);
      this.view.dispatch({ selection: { anchor: cursor } });
      this.view.focus();
    }
  }

  /** Destroys the editor, flushing any pending auto-save. */
  destroy(): void {
    if (!this.mounted) return;
    this.extResult?.autoSaveHandle.flush();
    this.view?.destroy();
    this.view = null;
    this.extResult = null;
    this.currentFilename = null;
    this.mounted = false;
  }

  /**
   * Creates a new note via IPC and loads the empty template.
   * Triggered by Cmd+N (macOS) / Ctrl+N (Linux).
   */
  async handleCreateNote(): Promise<void> {
    if (!this.view) return;

    try {
      this.extResult?.autoSaveHandle.flush();

      const result = await createNote();
      this.currentFilename = result.filename;

      const template = generateFrontmatterTemplate();
      const cursor = getBodyCursorPosition(template);

      this.view.dispatch({
        changes: {
          from: 0,
          to: this.view.state.doc.length,
          insert: template,
        },
        selection: { anchor: cursor },
      });
      this.view.focus();

      this.noteCreatedCb?.(result.filename);
    } catch (err) {
      this.errorHandler(
        err instanceof Error ? err : new Error(String(err)),
        'create-note',
      );
    }
  }

  /** Loads an existing note by filename (called from GridView navigation). */
  async loadNote(filename: string): Promise<void> {
    if (!this.view) return;

    try {
      this.extResult?.autoSaveHandle.flush();

      const result = await readNote(filename);
      this.currentFilename = filename;

      const cursor = getBodyCursorPosition(result.content);

      this.view.dispatch({
        changes: {
          from: 0,
          to: this.view.state.doc.length,
          insert: result.content,
        },
        selection: { anchor: cursor },
      });
      this.view.focus();
    } catch (err) {
      this.errorHandler(
        err instanceof Error ? err : new Error(String(err)),
        'load-note',
      );
    }
  }

  /** Body text excluding frontmatter (AC-ED-05 copy target). */
  getBodyText(): string {
    if (!this.view) return '';
    return extractBodyText(this.view.state.doc.toString());
  }

  /** Full document text including frontmatter. */
  getFullText(): string {
    if (!this.view) return '';
    return this.view.state.doc.toString();
  }

  /** Copies body text (excl. frontmatter) to clipboard. Convention 7. */
  async copyBodyToClipboard(): Promise<boolean> {
    return copyToClipboard(this.getBodyText());
  }

  getCurrentFilename(): string | null {
    return this.currentFilename;
  }

  getView(): EditorView | null {
    return this.view;
  }

  isMounted(): boolean {
    return this.mounted;
  }

  flushPendingSave(): void {
    this.extResult?.autoSaveHandle.flush();
  }

  hasPendingSave(): boolean {
    return this.extResult?.autoSaveHandle.pending() ?? false;
  }

  private async handleAutoSave(content: string): Promise<void> {
    if (!this.currentFilename) return;
    await saveNote(this.currentFilename, content);
  }
}
