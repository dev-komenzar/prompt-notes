// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 30-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:30 | module:editor | CoDD trace: detail:editor_clipboard, detail:component_architecture
// Factory for CodeMirror 6 EditorView with all required extensions:
//   - @codemirror/lang-markdown (Markdown syntax highlight, NO rendering)
//   - frontmatter background decoration
//   - Mod-n new-note keymap
//   - auto-save (500ms debounce)
// No title input field. No Markdown preview. CodeMirror 6 only.

import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';

import {
  frontmatterDecorationPlugin,
  frontmatterBaseTheme,
} from './frontmatter-decoration';
import { createNoteKeymap } from './editor-keymap';
import { createAutoSave, type AutoSaveController } from './auto-save';
import {
  FRONTMATTER_TEMPLATE,
  getCursorPositionAfterFrontmatter,
} from './frontmatter';
import { createNote, readNote } from './api';

export interface EditorInstance {
  /** Underlying CodeMirror EditorView. */
  readonly view: EditorView;
  /** Auto-save controller for lifecycle management. */
  readonly autoSave: AutoSaveController;
  /** Flush pending saves and destroy the EditorView. */
  destroy(): void;
  /** Load an existing note into the editor (flushes current save first). */
  loadNote(filename: string, content: string): void;
  /** Create a new note via IPC and load the empty template. */
  handleCreateNote(): Promise<void>;
  /** Current filename being edited. */
  getCurrentFilename(): string;
  /** Full document text (frontmatter + body). */
  getDocumentText(): string;
}

export interface EditorOptions {
  initialFilename?: string;
  initialContent?: string;
  onFilenameChange?: (filename: string) => void;
}

export function createEditorInstance(
  parent: HTMLElement,
  options: EditorOptions = {},
): EditorInstance {
  let currentFilename = options.initialFilename ?? '';

  const autoSave = createAutoSave(currentFilename);

  const handleCreateNote = async (): Promise<void> => {
    autoSave.flush();

    try {
      const response = await createNote();
      currentFilename = response.filename;
      autoSave.setFilename(currentFilename);

      const template = FRONTMATTER_TEMPLATE;

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: template,
        },
      });

      const cursorPos = getCursorPositionAfterFrontmatter(template);
      view.dispatch({
        selection: { anchor: cursorPos },
      });

      view.focus();

      options.onFilenameChange?.(currentFilename);
    } catch (err) {
      console.error('[editor] create_note failed:', err);
    }
  };

  const state = EditorState.create({
    doc: options.initialContent ?? '',
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      history(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      markdown(),
      frontmatterDecorationPlugin,
      frontmatterBaseTheme,
      createNoteKeymap(handleCreateNote),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      autoSave.extension,
      EditorView.lineWrapping,
    ],
  });

  const view = new EditorView({ state, parent });

  function loadNote(filename: string, content: string): void {
    autoSave.flush();

    currentFilename = filename;
    autoSave.setFilename(filename);

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: content,
      },
    });

    const cursorPos = getCursorPositionAfterFrontmatter(content);
    view.dispatch({
      selection: { anchor: cursorPos },
    });

    view.focus();

    options.onFilenameChange?.(currentFilename);
  }

  function destroy(): void {
    autoSave.flush();
    view.destroy();
  }

  return {
    view,
    autoSave,
    destroy,
    loadNote,
    handleCreateNote,
    getCurrentFilename: () => currentFilename,
    getDocumentText: () => view.state.doc.toString(),
  };
}
