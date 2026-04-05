// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:29 task:29-1 module:editor
// CoDD trace: detail:editor_clipboard §4.1, detail:component_architecture §4.3
// Orchestrates all CodeMirror 6 extensions into a single EditorView instance.
//
// Release-blocking constraints enforced by this module:
//   CONV-5:  CodeMirror 6 only, Markdown highlight only, no rendering
//   CONV-6:  No title input field — editor area is the sole UI element
//   CONV-7:  1-click copy via copyBodyToClipboard()
//   CONV-8:  Mod-n keymap for instant new note
//   CONV-11: Auto-save (500 ms debounce)
//   CONV-20: No Markdown preview / HTML rendering
//   CONV-24: CodeMirror 6 confirmed — no engine substitution

import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightSpecialChars,
  drawSelection,
} from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

import { frontmatterDecoration, frontmatterTheme } from './frontmatter-decoration';
import { createAutoSave, AUTOSAVE_DEBOUNCE_MS, type AutoSaveHandle } from './auto-save';
import { createNewNoteKeymap } from './editor-keymap';
import { createFrontmatterTemplate, getBodyStartPosition } from './frontmatter-utils';
import { copyBodyToClipboard } from './clipboard';
import { readNote } from './api';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface EditorSetupOptions {
  /** DOM element to mount the CodeMirror EditorView into. */
  parent: HTMLElement;
  /** Filename of the note to load on creation (if resuming an edit). */
  initialFilename?: string;
  /** Raw file content to pre-populate (avoids an extra IPC round-trip). */
  initialContent?: string;
  /** Override the default debounce interval (ms). */
  debounceMs?: number;

  // -- Callbacks -----------------------------------------------------------
  /** Fired after Cmd+N / Ctrl+N creates a new note on disk. */
  onNewNote?: (filename: string) => void;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: unknown) => void;
  onNewNoteError?: (error: unknown) => void;
  onLoadError?: (error: unknown) => void;
}

export interface EditorInstance {
  /** The underlying CodeMirror EditorView. */
  readonly view: EditorView;

  /** Returns the full document text (frontmatter + body). */
  getContent(): string;

  /** Returns only the body text with frontmatter stripped. */
  getBodyText(): string;

  /**
   * Copies the body text (frontmatter excluded) to the system clipboard.
   * CONV-7: core UX, release-blocking.
   */
  copyBodyToClipboard(): Promise<boolean>;

  /** Loads an existing note from disk via `read_note` IPC. */
  loadNote(filename: string): Promise<void>;

  /**
   * Replaces the document with an empty frontmatter template and sets the
   * current filename.  Used after `create_note` IPC succeeds.
   */
  loadNewNote(filename: string): void;

  /** Immediately persists any pending auto-save. */
  flushSave(): void;

  /** The filename currently being edited, or null. */
  getCurrentFilename(): string | null;

  /** Manually override the current filename (rare). */
  setCurrentFilename(filename: string): void;

  /**
   * Flushes pending saves, removes event listeners, and destroys the
   * EditorView.  Must be called in the component's `onDestroy` hook.
   */
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createEditor(options: EditorSetupOptions): EditorInstance {
  let currentFilename: string | null = options.initialFilename ?? null;

  // -- Auto-save (CONV-11, Sprint 29 deliverable) --------------------------
  const autoSave: AutoSaveHandle = createAutoSave(
    {
      getFilename: () => currentFilename,
      onSaveStart: options.onSaveStart,
      onSaveComplete: options.onSaveComplete,
      onSaveError: options.onSaveError,
    },
    options.debounceMs ?? AUTOSAVE_DEBOUNCE_MS,
  );

  // -- Cmd+N / Ctrl+N (CONV-8) --------------------------------------------
  const newNoteKeymap = createNewNoteKeymap({
    onNoteCreated: (filename: string, _path: string) => {
      autoSave.flush();
      instance.loadNewNote(filename);
      options.onNewNote?.(filename);
    },
    onError: options.onNewNoteError,
  });

  // -- Extension stack -----------------------------------------------------
  const extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLine(),
    highlightSpecialChars(),
    drawSelection(),
    indentOnInput(),
    history(),
    bracketMatching(),
    closeBrackets(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    // CONV-5: Markdown syntax highlighting only — no HTML rendering
    markdown(),
    // CONV-5: frontmatter background-color decoration
    frontmatterDecoration,
    frontmatterTheme,
    newNoteKeymap,
    autoSave.extension,
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
  ];

  // -- EditorView creation -------------------------------------------------
  const view = new EditorView({
    state: EditorState.create({
      doc: options.initialContent ?? '',
      extensions,
    }),
    parent: options.parent,
  });

  // -- beforeunload guard: flush pending save on app / tab close -----------
  const handleBeforeUnload = (): void => {
    autoSave.flush();
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  // -- Helpers -------------------------------------------------------------
  const replaceDocument = (content: string): void => {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  };

  const focusAtBodyStart = (content: string): void => {
    const pos = getBodyStartPosition(content);
    const safePos = Math.min(pos, view.state.doc.length);
    view.dispatch({ selection: { anchor: safePos } });
    view.focus();
  };

  // -- Instance ------------------------------------------------------------
  const instance: EditorInstance = {
    view,

    getContent: () => view.state.doc.toString(),

    getBodyText: () => {
      const { extractBodyText } = require('./frontmatter-utils') as typeof import('./frontmatter-utils');
      return extractBodyText(view.state.doc.toString());
    },

    copyBodyToClipboard: () => copyBodyToClipboard(view.state.doc.toString()),

    loadNote: async (filename: string): Promise<void> => {
      autoSave.flush();
      try {
        const result = await readNote(filename);
        currentFilename = filename;
        replaceDocument(result.content);
        focusAtBodyStart(result.content);
      } catch (error: unknown) {
        options.onLoadError?.(error);
      }
    },

    loadNewNote: (filename: string): void => {
      autoSave.flush();
      currentFilename = filename;
      const template = createFrontmatterTemplate();
      replaceDocument(template);
      focusAtBodyStart(template);
    },

    flushSave: () => autoSave.flush(),

    getCurrentFilename: () => currentFilename,

    setCurrentFilename: (filename: string) => {
      currentFilename = filename;
    },

    destroy: (): void => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      autoSave.flush();
      view.destroy();
    },
  };

  return instance;
}
