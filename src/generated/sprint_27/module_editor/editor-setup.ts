// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 27 – module:editor – Complete editor factory
// Aggregates all CM6 extensions into a single setup function.
// Framework-agnostic: returns an EditorView that can be mounted by Svelte, React, or vanilla JS.

import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/language';
import { markdownExtension } from './markdown-extension';
import { frontmatterDecoration } from './frontmatter-decoration';
import { frontmatterTheme } from './frontmatter-theme';
import { newNoteKeymap, type NewNoteHandler } from './keymap-extension';
import { createAutosave, type SaveContentFn, type AutosaveHandle } from './autosave-extension';
import { detectFrontmatterRange } from './frontmatter-detection';
import { EMPTY_FRONTMATTER_TEMPLATE } from './frontmatter-template';

export interface EditorConfig {
  /** DOM element to mount the editor into. */
  readonly parent: HTMLElement;
  /** Initial document content. Defaults to empty string. */
  readonly doc?: string;
  /** Handler for Mod-n (Cmd+N / Ctrl+N) new note creation. */
  readonly onNewNote: NewNoteHandler;
  /** Handler called with full document content on auto-save. */
  readonly onSave: SaveContentFn;
  /** Auto-save debounce interval in ms. Default 500. */
  readonly autosaveDelay?: number;
  /** Additional extensions to include. */
  readonly extraExtensions?: readonly Extension[];
}

export interface EditorHandle {
  /** The CodeMirror EditorView instance. */
  readonly view: EditorView;
  /** Auto-save lifecycle controls. */
  readonly autosave: AutosaveHandle;
  /** Replace the entire editor content (e.g. when switching notes). */
  replaceContent(content: string): void;
  /** Place cursor at body start (after frontmatter) and focus the editor. */
  focusBody(): void;
  /** Get the full document text. */
  getFullText(): string;
  /** Clean up: flush pending saves and destroy the EditorView. */
  destroy(): void;
}

/**
 * Create a fully configured CodeMirror 6 editor for PromptNotes.
 *
 * Includes:
 * - Markdown syntax highlighting (@codemirror/lang-markdown)
 * - Frontmatter background decoration (StateField + Decoration, OQ-002)
 * - Cmd+N / Ctrl+N new note keymap
 * - Auto-save with debounce
 * - Line numbers, active line highlight, bracket matching
 * - Line wrapping
 * - History (undo/redo)
 *
 * Does NOT include:
 * - Title input field (prohibited, RBC-2)
 * - Markdown preview / rendering (prohibited, RBC-2)
 * - Manual save button or Cmd+S (auto-save only, RBC-3)
 */
export function createEditor(config: EditorConfig): EditorHandle {
  const autosave = createAutosave(config.onSave, config.autosaveDelay ?? 500);

  const extensions: Extension[] = [
    lineNumbers(),
    history(),
    drawSelection(),
    highlightActiveLine(),
    bracketMatching(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    markdownExtension(),
    frontmatterDecoration(),
    frontmatterTheme,
    newNoteKeymap(config.onNewNote),
    autosave.extension,
    ...(config.extraExtensions ?? []),
  ];

  const state = EditorState.create({
    doc: config.doc ?? '',
    extensions,
  });

  const view = new EditorView({
    state,
    parent: config.parent,
  });

  const handle: EditorHandle = {
    view,
    autosave,

    replaceContent(content: string): void {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: content,
        },
      });
    },

    focusBody(): void {
      const doc = view.state.doc;
      let cursorPos = 0;

      const range = detectFrontmatterRange(doc);
      if (range !== null) {
        let pos = range.to;
        // Move past newline after closing ---
        if (pos < doc.length) {
          pos += 1;
        }
        // Skip one blank line if present
        if (pos < doc.length) {
          const line = doc.lineAt(pos);
          if (line.text.trim() === '') {
            cursorPos = line.to < doc.length ? line.to + 1 : doc.length;
          } else {
            cursorPos = pos;
          }
        } else {
          cursorPos = doc.length;
        }
      }

      if (cursorPos > doc.length) {
        cursorPos = doc.length;
      }

      view.dispatch({
        selection: { anchor: cursorPos },
      });
      view.focus();
    },

    getFullText(): string {
      return view.state.doc.toString();
    },

    destroy(): void {
      autosave.flush();
      view.destroy();
    },
  };

  return handle;
}

/**
 * Helper to initialise a new note in an existing editor.
 * Creates the note via IPC, replaces content with template, and focuses body.
 */
export async function initNewNoteInEditor(
  handle: EditorHandle,
  createNoteFn: () => Promise<{ filename: string }>,
): Promise<string> {
  // Flush any pending save for the current note before switching
  handle.autosave.flush();

  const { filename } = await createNoteFn();
  handle.replaceContent(EMPTY_FRONTMATTER_TEMPLATE);
  handle.focusBody();

  return filename;
}
