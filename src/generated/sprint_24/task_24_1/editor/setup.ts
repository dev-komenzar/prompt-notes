// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — CodeMirror 6 Editor Setup
// Assembles all required CM6 extensions into a single configuration.
// Enforces: Markdown syntax highlight only (no rendering/preview),
// frontmatter background decoration, auto-save, and Mod-n keybinding.

import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, lineNumbers, drawSelection, highlightActiveLine } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { frontmatterDecorationPlugin } from './frontmatter-decoration';
import { promptnotesTheme } from './theme';
import { createAutosaveExtension, type AutosaveCallbacks } from './autosave-extension';
import { createPromptnotesKeymap, type KeybindingCallbacks } from './keybindings';

export interface EditorSetupOptions {
  /** Auto-save callback; receives full document content (frontmatter + body). */
  autosave: AutosaveCallbacks;
  /** Key binding callbacks. */
  keybindings: KeybindingCallbacks;
}

export interface EditorSetupResult {
  /** All CM6 extensions, ready to pass to EditorState.create({ extensions }). */
  extensions: Extension[];
  /** Flush any pending auto-save (call on note switch / component destroy). */
  flushAutosave: () => void;
  /** Cancel pending auto-save without executing. */
  cancelAutosave: () => void;
}

/**
 * Create the complete set of CodeMirror 6 extensions for the PromptNotes editor.
 *
 * Includes:
 * - Markdown syntax highlighting (@codemirror/lang-markdown) — highlight only, no rendering
 * - Frontmatter background decoration (ViewPlugin)
 * - PromptNotes theme (frontmatter bg color via CSS variable)
 * - Auto-save on document change (500ms debounce)
 * - Mod-n new note creation keybinding
 * - Standard editing features (undo/redo, line numbers, active line highlight)
 *
 * Does NOT include:
 * - Markdown preview/rendering (prohibited — release blocker)
 * - Title input field (prohibited — release blocker)
 * - Manual save keybinding (unnecessary; auto-save handles all persistence)
 */
export function createEditorSetup(options: EditorSetupOptions): EditorSetupResult {
  const autosave = createAutosaveExtension(options.autosave);
  const promptnotesKeymap = createPromptnotesKeymap(options.keybindings);

  const extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLine(),
    drawSelection(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    markdown(),
    syntaxHighlighting(defaultHighlightStyle),
    frontmatterDecorationPlugin,
    promptnotesTheme,
    autosave.extension,
    promptnotesKeymap,
    EditorView.lineWrapping,
  ];

  return {
    extensions,
    flushAutosave: () => autosave.flush(),
    cancelAutosave: () => autosave.cancel(),
  };
}

/**
 * Create a new EditorView instance with PromptNotes configuration.
 *
 * @param parent - DOM element to mount the editor into
 * @param doc - Initial document content (empty string for new notes)
 * @param options - Auto-save and keybinding callbacks
 * @returns The EditorView instance and auto-save controls
 */
export function createEditorView(
  parent: HTMLElement,
  doc: string,
  options: EditorSetupOptions,
): { view: EditorView } & Omit<EditorSetupResult, 'extensions'> {
  const setup = createEditorSetup(options);

  const state = EditorState.create({
    doc,
    extensions: setup.extensions,
  });

  const view = new EditorView({ state, parent });

  return {
    view,
    flushAutosave: setup.flushAutosave,
    cancelAutosave: setup.cancelAutosave,
  };
}
