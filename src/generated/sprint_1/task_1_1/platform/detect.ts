// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --sprint 1 --task 1-1

/**
 * Platform detection utilities.
 * Target platforms: Linux, macOS only. Windows is out of scope.
 */

export type SupportedPlatform = 'linux' | 'macos';

/**
 * Detects the current platform from navigator.platform.
 * Used for Cmd (macOS) vs Ctrl (Linux) key binding differentiation.
 *
 * @returns 'macos' or 'linux'
 */
export function detectPlatform(): SupportedPlatform {
  if (typeof navigator !== 'undefined') {
    const platform = navigator.platform.toUpperCase();
    if (platform.indexOf('MAC') >= 0) {
      return 'macos';
    }
  }
  return 'linux';
}

/**
 * Returns the modifier key name for the current platform.
 * macOS: Meta (Cmd), Linux: Control (Ctrl)
 */
export function getPlatformModifierKey(): 'Meta' | 'Control' {
  return detectPlatform() === 'macos' ? 'Meta' : 'Control';
}

/**
 * Checks if the correct platform modifier is pressed for a keyboard event.
 * macOS: metaKey (Cmd), Linux: ctrlKey
 */
export function isPlatformModifierPressed(event: KeyboardEvent): boolean {
  return detectPlatform() === 'macos' ? event.metaKey : event.ctrlKey;
}
