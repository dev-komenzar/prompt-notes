// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 28 | Task 28-1 | module:editor
// Traceability: detail:editor_clipboard §4.1, detail:component_architecture §4.3
// Combines all CodeMirror 6 extensions into a single setup for Editor.svelte.

import type { Extension } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { frontmatterDecorationField } from './frontmatter-decoration';
import { frontmatterTheme } from './frontmatter-theme';
import { newNoteKeymap, type OnNoteCreated } from './editor-keymap';
import { createAutosave, type AutosaveHandle } from './editor-autosave';

export interface EditorSetupOptions {
  /** Callback to update the current filename in component state. */
  setCurrentFilename: (filename: string) => void;
  /** Returns the currently-active filename for autosave targeting. */
  getCurrentFilename: () => string;
  /** Optional callback after a new note is created via Mod-n. */
  onNoteCreated?: OnNoteCreated;
  /** Autosave debounce interval in ms. Defaults to 500. */
  autosaveDebounceMs?: number;
}

export interface EditorSetupResult {
  /** Array of CM6 extensions to pass to EditorState.create. */
  extensions: Extension[];
  /** Handle for flushing/cancelling the autosave debounce timer. */
  autosave: AutosaveHandle;
}

/**
 * Creates the complete set of CodeMirror 6 extensions for the PromptNotes editor.
 *
 * Includes:
 * - Markdown syntax highlighting (@codemirror/lang-markdown) — CONV: CodeMirror 6 必須
 * - Frontmatter background-color decoration — CONV: 背景色で視覚的に区別必須
 * - Mod-n (Cmd+N / Ctrl+N) new-note keymap — CONV: 即座に新規ノート作成
 * - Auto-save via updateListener + debounce — CONV: 自動保存必須
 *
 * Does NOT include:
 * - Title input field (CONV: タイトル入力欄禁止)
 * - Markdown preview/rendering (CONV: レンダリング禁止)
 */
export function createEditorSetup(options: EditorSetupOptions): EditorSetupResult {
  const autosave = createAutosave(
    options.getCurrentFilename,
    options.autosaveDebounceMs,
  );

  const extensions: Extension[] = [
    markdown(),
    frontmatterDecorationField,
    frontmatterTheme,
    newNoteKeymap(options.setCurrentFilename, options.onNoteCreated),
    autosave.extension,
  ];

  return { extensions, autosave };
}
