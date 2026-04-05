// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:4 task:4-1 module:shell file:fs-access-guard.ts
// Runtime guard to detect and block any attempt to access the filesystem
// directly from the WebView. Complements Tauri capability restrictions.
//
// Convention CONV-1: All file operations MUST go through Rust backend via IPC.
// This module provides defense-in-depth at the JavaScript runtime level.

/**
 * Result of a filesystem access guard installation.
 */
export interface GuardInstallResult {
  readonly installed: boolean;
  readonly guardsApplied: readonly string[];
}

/**
 * Blocked API surface patterns. Each entry describes a global object path
 * and property that should not be available in the PromptNotes WebView.
 */
const BLOCKED_APIS: ReadonlyArray<{
  readonly object: string;
  readonly property: string;
  readonly description: string;
}> = [
  {
    object: 'window',
    property: 'showOpenFilePicker',
    description: 'File System Access API (showOpenFilePicker)',
  },
  {
    object: 'window',
    property: 'showSaveFilePicker',
    description: 'File System Access API (showSaveFilePicker)',
  },
  {
    object: 'window',
    property: 'showDirectoryPicker',
    description: 'File System Access API (showDirectoryPicker)',
  },
];

/**
 * Install runtime guards that prevent direct filesystem access from WebView code.
 *
 * This function:
 * 1. Overrides known browser File System Access APIs with no-op throwing stubs
 * 2. Intercepts fetch() calls to file:// URLs
 *
 * Call this once during application bootstrap (e.g., in the Svelte root component
 * or main.ts entry point) BEFORE any other module initializes.
 *
 * These guards are defense-in-depth. The primary enforcement is the Tauri
 * capability configuration that denies fs:* permissions.
 */
export function installFsAccessGuards(): GuardInstallResult {
  const applied: string[] = [];

  // Block File System Access API endpoints
  for (const api of BLOCKED_APIS) {
    try {
      const target = resolveGlobal(api.object);
      if (target && api.property in target) {
        Object.defineProperty(target, api.property, {
          value: () => {
            throw new FsAccessViolationError(api.description);
          },
          writable: false,
          configurable: false,
        });
        applied.push(api.description);
      }
    } catch {
      // Property may already be non-configurable; skip silently
    }
  }

  // Intercept fetch('file://...') calls
  const originalFetch = globalThis.fetch;
  if (typeof originalFetch === 'function') {
    globalThis.fetch = function guardedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input instanceof Request
              ? input.url
              : '';

      if (url.startsWith('file://')) {
        throw new FsAccessViolationError(
          `fetch("${url}") — file:// protocol access is prohibited`,
        );
      }

      return originalFetch.call(globalThis, input, init);
    } as typeof fetch;
    applied.push('fetch file:// interception');
  }

  // Block XMLHttpRequest to file:// URLs
  const OriginalXHR = globalThis.XMLHttpRequest;
  if (typeof OriginalXHR === 'function') {
    const originalOpen = OriginalXHR.prototype.open;
    OriginalXHR.prototype.open = function guardedOpen(
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ): void {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.startsWith('file://')) {
        throw new FsAccessViolationError(
          `XMLHttpRequest.open("${method}", "${urlStr}") — file:// protocol access is prohibited`,
        );
      }
      return (originalOpen as Function).call(this, method, url, ...rest);
    };
    applied.push('XMLHttpRequest file:// interception');
  }

  return {
    installed: applied.length > 0,
    guardsApplied: applied,
  };
}

/**
 * Resolve a global object by dot-separated path.
 */
function resolveGlobal(path: string): Record<string, unknown> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = globalThis;
    for (const segment of path.split('.')) {
      current = current[segment];
      if (current == null) return null;
    }
    return current as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Error thrown when WebView code attempts direct filesystem access.
 */
export class FsAccessViolationError extends Error {
  constructor(detail: string) {
    super(
      `[PromptNotes Security] Direct filesystem access from WebView is prohibited. ` +
        `All file operations must use IPC commands via api.ts. ` +
        `Blocked: ${detail}`,
    );
    this.name = 'FsAccessViolationError';
  }
}
