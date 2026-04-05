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
// Assembles all CM6 extensions for the PromptNotes editor.
//
// Includes:
//   - Markdown syntax highlighting (convention 5, 24)
//   - Frontmatter background decoration (convention 5)
//   - Platform-aware keybindings (convention 8)
//   - Auto-save with debounce (convention 11)
//   - Line wrapping
//
// Does NOT include (release-blocking prohibitions):
//   - Markdown preview/rendering (convention 20)
//   - Title input field (convention 6)
//   - AI features (convention 2)

import { EditorView } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { frontmatterDecoration } from './frontmatter-decoration';
import {
  editorKeymapExtension,
  type EditorKeybindingHandlers,
} from './keybindings';
import { createAutoSave, type AutoSaveConfig, type AutoSaveHandle } from './auto-save';
import type { Extension } from '@codemirror/state';

export interface EditorExtensionsConfig {
  keybindingHandlers: EditorKeybindingHandlers;
  autoSaveConfig: AutoSaveConfig;
}

export interface EditorExtensionsResult {
  extensions: Extension[];
  autoSaveHandle: AutoSaveHandle;
}

export function createEditorExtensions(
  config: EditorExtensionsConfig,
): EditorExtensionsResult {
  const autoSave = createAutoSave(config.autoSaveConfig);

  const extensions: Extension[] = [
    markdown(),
    ...frontmatterDecoration(),
    editorKeymapExtension(config.keybindingHandlers),
    autoSave.extension,
    EditorView.lineWrapping,
  ];

  return { extensions, autoSaveHandle: autoSave };
}
