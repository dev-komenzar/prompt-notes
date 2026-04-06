// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 57-1
// @task-title: 対象プラットフォーム
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=57, task=57-1, deliverable=対象プラットフォーム
// Conventions: platform:linux, platform:macos — Linux・macOS対応必須。Windowsは将来対応としスコープ外。
// Conventions: framework:tauri — Tauri（Rust + WebView）アーキテクチャ必須。

/**
 * Supported platform identifiers for PromptNotes.
 * Windows is explicitly out of scope and must not be added
 * without a formal requirements change process.
 */
export const Platform = {
  Linux: 'linux',
  MacOS: 'macos',
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

/**
 * Unsupported platform identifier used for rejection.
 */
export const UnsupportedPlatform = {
  Windows: 'windows',
} as const;

export type UnsupportedPlatform =
  (typeof UnsupportedPlatform)[keyof typeof UnsupportedPlatform];

/**
 * All known platform strings (supported + unsupported).
 */
export type KnownPlatform = Platform | UnsupportedPlatform;

/**
 * WebView engine used per platform (informational).
 */
export const WebViewEngine: Record<Platform, string> = {
  [Platform.Linux]: 'GTK WebKitGTK',
  [Platform.MacOS]: 'WKWebView',
} as const;

/**
 * Detects the current platform from the browser/WebView user agent string.
 * Returns `null` if the platform is unsupported.
 */
export function detectPlatform(): Platform | null {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('mac os') || ua.includes('macintosh')) {
    return Platform.MacOS;
  }

  if (ua.includes('linux') || ua.includes('x11')) {
    return Platform.Linux;
  }

  // Windows and all other platforms are unsupported — return null.
  return null;
}

/**
 * Returns the detected platform or throws if the platform is unsupported.
 * This is the primary entry point for components that require a valid platform.
 */
export function requireSupportedPlatform(): Platform {
  const platform = detectPlatform();
  if (platform === null) {
    throw new PlatformNotSupportedError(
      'PromptNotes supports Linux and macOS only. Windows is not supported in this release.'
    );
  }
  return platform;
}

/**
 * Type guard: checks whether a string is a supported Platform.
 */
export function isSupportedPlatform(value: string): value is Platform {
  return value === Platform.Linux || value === Platform.MacOS;
}

/**
 * Error thrown when the application is launched on an unsupported platform.
 */
export class PlatformNotSupportedError extends Error {
  public readonly name = 'PlatformNotSupportedError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, PlatformNotSupportedError.prototype);
  }
}
