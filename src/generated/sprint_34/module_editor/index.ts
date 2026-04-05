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
// Public API surface for module:editor.

export { EditorController } from './editor-controller';

export type {
  NoteEntry,
  CreateNoteResult,
  ReadNoteResult,
  Config,
  ErrorHandler,
  EditorMountOptions,
} from './types';

export { createNote, saveNote, readNote, deleteNote } from './api';

export { copyToClipboard } from './clipboard';

export {
  extractBodyText,
  generateFrontmatterTemplate,
  getBodyCursorPosition,
  detectFrontmatterRange,
} from './frontmatter';
export type { FrontmatterRange } from './frontmatter';

export {
  detectPlatform,
  isMacOS,
  isLinux,
  getModifierKeyLabel,
  getNewNoteKeybindLabel,
  resolveModKey,
} from './platform';
export type { SupportedPlatform } from './platform';

export {
  validatePlatformKeybindings,
  getKeybindingDisplayMap,
  matchesKeybinding,
  createTestKeyboardEvent,
  EDITOR_KEYBINDING_SPECS,
} from './keybinding-validator';
export type {
  KeybindingSpec,
  KeybindingValidationResult,
  KeybindingValidationEntry,
} from './keybinding-validator';

export { createAutoSave, AUTO_SAVE_DEBOUNCE_MS } from './auto-save';
export type { AutoSaveConfig, AutoSaveHandle } from './auto-save';

export { debounce } from './debounce';
export type { DebouncedFunction } from './debounce';

export { frontmatterDecoration } from './frontmatter-decoration';

export { editorKeymapExtension } from './keybindings';
export type { EditorKeybindingHandlers } from './keybindings';

export { createEditorExtensions } from './extensions';
export type {
  EditorExtensionsConfig,
  EditorExtensionsResult,
} from './extensions';
