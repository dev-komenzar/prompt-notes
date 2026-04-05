// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:2 task:2-1 module:shell node:detail:component_architecture
// Platform detection for UI hints (keybinding labels, etc.).
// Target platforms: Linux (GTK WebKitGTK) and macOS (WKWebView).
// Windows is out of scope.

export type SupportedPlatform = 'macos' | 'linux';

let cachedPlatform: SupportedPlatform | null = null;

/**
 * Detect the current platform.
 * Falls back to 'linux' for any non-macOS environment.
 */
export function getPlatform(): SupportedPlatform {
  if (cachedPlatform !== null) return cachedPlatform;
  const ua = navigator.userAgent || '';
  cachedPlatform = /Mac/.test(ua) ? 'macos' : 'linux';
  return cachedPlatform;
}

/**
 * Return the platform-appropriate modifier key label.
 * macOS → "⌘"  |  Linux → "Ctrl"
 */
export function modKeyLabel(): string {
  return getPlatform() === 'macos' ? '⌘' : 'Ctrl';
}

/**
 * Shortcut label for "New Note" action displayed in UI.
 */
export function newNoteShortcutLabel(): string {
  return `${modKeyLabel()}+N`;
}
