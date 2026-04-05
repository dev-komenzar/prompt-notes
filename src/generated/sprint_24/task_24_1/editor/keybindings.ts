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

// PromptNotes — CodeMirror 6 Key Bindings
// Registers Mod-n (Cmd+N on macOS, Ctrl+N on Linux) for instant new note creation.
// CodeMirror's "Mod" prefix automatically maps to the platform-appropriate modifier.
// No platform-specific branching is required in this module.

import { keymap } from '@codemirror/view';
import type { KeyBinding } from '@codemirror/view';

export interface KeybindingCallbacks {
  /** Called when Mod-n is pressed. Should invoke createNote IPC and reset editor. */
  onCreateNote: () => boolean | void;
}

/**
 * Creates a CodeMirror 6 keymap extension with PromptNotes-specific bindings.
 *
 * Registered bindings:
 * - Mod-n: Create new note (Cmd+N on macOS, Ctrl+N on Linux)
 *
 * The `onCreateNote` callback should:
 * 1. Call api.createNote() to generate a new file via Rust backend
 * 2. Replace editor document with frontmatter template
 * 3. Focus the body area (after frontmatter closing ---)
 *
 * Return `true` from the callback to indicate the key was handled and prevent
 * default browser behavior (e.g., browser new-window on Ctrl+N).
 *
 * Usage in Editor.svelte:
 *   import { createPromptnotesKeymap } from './editor/keybindings';
 *   extensions: [
 *     createPromptnotesKeymap({
 *       onCreateNote: () => { handleCreateNote(); return true; },
 *     }),
 *   ]
 */
export function createPromptnotesKeymap(callbacks: KeybindingCallbacks) {
  const bindings: readonly KeyBinding[] = [
    {
      key: 'Mod-n',
      run: () => {
        const result = callbacks.onCreateNote();
        // Return true to prevent default browser behavior
        return result === true || result === undefined;
      },
      preventDefault: true,
    },
  ];

  return keymap.of(bindings as KeyBinding[]);
}
