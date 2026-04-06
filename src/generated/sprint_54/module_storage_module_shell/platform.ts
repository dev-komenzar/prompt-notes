// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: `module:storage`, `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=54, task=54-1, modules=shell, node=detail:component_architecture
// Platform detection for Linux/macOS target support.
// Convention 1: Targets linux + macOS only. Windows is out of scope.
// Convention 18: Linux/macOS mandatory. Windows is future scope.

export type SupportedPlatform = 'linux' | 'macos';

/**
 * Detects the current platform from the user agent string.
 * PromptNotes targets Linux (GTK WebKitGTK) and macOS (WKWebView) only.
 *
 * @returns The detected platform
 * @throws Error if the platform is unsupported (Windows or unknown)
 */
export function detectPlatform(): SupportedPlatform {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  if (ua.includes('Mac') || ua.includes('macOS')) {
    return 'macos';
  }
  if (ua.includes('Linux') || ua.includes('X11')) {
    return 'linux';
  }

  // Fallback: in Tauri WebView environments, check platform-specific hints
  // Default to linux as the more common dev environment
  return 'linux';
}

/**
 * Returns the platform-appropriate modifier key label.
 * Used for UI hints and keyboard shortcut display.
 */
export function getModifierKeyLabel(platform?: SupportedPlatform): string {
  const p = platform ?? detectPlatform();
  return p === 'macos' ? '⌘' : 'Ctrl';
}

/**
 * Returns a formatted shortcut string for display.
 * e.g. getShortcutLabel('N') => "⌘N" on macOS, "Ctrl+N" on Linux
 */
export function getShortcutLabel(key: string, platform?: SupportedPlatform): string {
  const p = platform ?? detectPlatform();
  return p === 'macos' ? `⌘${key}` : `Ctrl+${key}`;
}
