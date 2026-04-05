// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:26 | task:26-1 | module:editor
// Manages the CodeMirror 6 EditorView lifecycle, auto-save, note CRUD,
// and clipboard copy.  Designed to be instantiated once per Editor.svelte
// and driven through its public API.
//
// CONV: 自動保存必須 — 500ms debounce, no manual save button.
// CONV: Cmd+N / Ctrl+N 即時新規ノート作成 + フォーカス移動.
// CONV: 1クリックコピーボタンによる本文クリップボードコピー.
// CONV: タイトル入力欄禁止 — 本文のみのエディタ画面.

import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { createEditorExtensions } from './editor-extensions';
import { createNote, saveNote, readNote } from './api';
import { debounce, type DebouncedFunction } from './debounce';
import {
  generateFrontmatterTemplate,
  extractBodyText,
  getBodyStartPosition,
} from './frontmatter';
import { copyToClipboard } from './clipboard';

/** Debounce interval for auto-save (milliseconds). */
const AUTOSAVE_DEBOUNCE_MS = 500;

export class EditorController {
  private view: EditorView | null = null;
  private currentFilename: string | null = null;
  private debouncedSave: DebouncedFunction<[]> | null = null;

  /**
   * Tracks the most-recent in-flight save so that callers of
   * `loadNote` / `destroy` can await its completion.
   */
  private savePromise: Promise<void> = Promise.resolve();

  // ───────── public accessors ─────────

  get editorView(): EditorView | null {
    return this.view;
  }

  get filename(): string | null {
    return this.currentFilename;
  }

  // ───────── lifecycle ─────────

  /**
   * Create the CodeMirror 6 EditorView and mount it into `container`.
   * Optionally pre-populate with `initialContent` for an existing note.
   */
  mount(
    container: HTMLElement,
    initialContent?: string,
    filename?: string,
  ): void {
    if (this.view) {
      this.destroy();
    }

    this.currentFilename = filename ?? null;

    this.debouncedSave = debounce(() => {
      this.performSave();
    }, AUTOSAVE_DEBOUNCE_MS);

    const extensions = createEditorExtensions({
      onDocChanged: () => {
        this.debouncedSave?.();
      },
      onCreateNote: () => {
        void this.handleCreateNote();
      },
    });

    const doc = initialContent ?? '';

    this.view = new EditorView({
      state: EditorState.create({ doc, extensions }),
      parent: container,
    });

    if (doc) {
      const cursorPos = getBodyStartPosition(doc);
      this.view.dispatch({ selection: { anchor: cursorPos } });
    }

    this.view.focus();
  }

  /**
   * Flush any pending auto-save and tear down the EditorView.
   * Call from Svelte `onDestroy`.
   */
  destroy(): void {
    this.flushPendingSave();
    this.view?.destroy();
    this.view = null;
    this.currentFilename = null;
    this.debouncedSave = null;
  }

  // ───────── note operations ─────────

  /**
   * Load an existing note into the editor (e.g. when navigating from GridView).
   * Flushes any pending save for the current note first.
   */
  async loadNote(filename: string): Promise<void> {
    this.flushPendingSave();
    await this.savePromise;

    const { content } = await readNote(filename);

    if (!this.view) return;

    this.currentFilename = filename;
    const cursorPos = getBodyStartPosition(content);

    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: content },
      selection: { anchor: cursorPos },
    });
    this.view.focus();
  }

  /**
   * Create a brand-new note via IPC, replace the editor content with an
   * empty frontmatter template, and focus the body area.
   * Triggered by Cmd+N / Ctrl+N keymap.
   */
  async handleCreateNote(): Promise<void> {
    this.flushPendingSave();
    await this.savePromise;

    try {
      const { filename } = await createNote();

      if (!this.view) return;

      this.currentFilename = filename;
      const template = generateFrontmatterTemplate();
      const cursorPos = getBodyStartPosition(template);

      this.view.dispatch({
        changes: {
          from: 0,
          to: this.view.state.doc.length,
          insert: template,
        },
        selection: { anchor: cursorPos },
      });
      this.view.focus();

      // Kick off an initial save so the template is persisted.
      this.debouncedSave?.();
    } catch (err) {
      console.error('[module:editor] Failed to create note:', err);
    }
  }

  // ───────── clipboard ─────────

  /**
   * Copy the body text (frontmatter excluded) to the system clipboard.
   * Returns `true` on success.
   */
  async copyBodyToClipboard(): Promise<boolean> {
    if (!this.view) return false;
    const bodyText = this.getBodyText();
    return copyToClipboard(bodyText);
  }

  // ───────── text accessors ─────────

  /** Full document text including frontmatter. */
  getDocumentText(): string {
    return this.view?.state.doc.toString() ?? '';
  }

  /** Body text only (frontmatter stripped). */
  getBodyText(): string {
    return extractBodyText(this.getDocumentText());
  }

  // ───────── internals ─────────

  private flushPendingSave(): void {
    this.debouncedSave?.flush();
  }

  private performSave(): void {
    if (!this.view || !this.currentFilename) return;

    const content = this.view.state.doc.toString();
    const filename = this.currentFilename;

    this.savePromise = saveNote(filename, content).catch((err) => {
      console.error('[module:editor] Auto-save failed:', err);
    });
  }
}
