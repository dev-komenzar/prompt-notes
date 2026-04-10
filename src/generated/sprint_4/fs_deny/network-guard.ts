// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `fs` プラグイン `deny`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd generate --sprint 4 --task 4-1
// @trace: design:system-design §2.9, test:acceptance_criteria FC-SC-02

/**
 * Network communication guard.
 *
 * PromptNotes must never perform network communication (privacy constraint).
 * This module intercepts `fetch` and `XMLHttpRequest` in development/test
 * environments to detect and reject any outbound network requests.
 *
 * In production builds this guard is a no-op to avoid performance overhead;
 * the tauri.conf.json `http: deny` policy provides the hard enforcement.
 */

export interface NetworkViolation {
  readonly timestamp: number;
  readonly method: string;
  readonly url: string;
  readonly stack: string | undefined;
}

const violations: NetworkViolation[] = [];

let guardActive = false;
let originalFetch: typeof globalThis.fetch | null = null;
let originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;

function recordViolation(method: string, url: string): NetworkViolation {
  const v: NetworkViolation = {
    timestamp: Date.now(),
    method,
    url,
    stack: new Error().stack,
  };
  violations.push(v);
  return v;
}

/**
 * Installs network interception that blocks and records all outbound requests.
 * Intended for development and E2E test environments.
 *
 * @param mode - 'block' throws on violation; 'record' only records without throwing.
 */
export function installNetworkGuard(mode: 'block' | 'record' = 'block'): void {
  if (guardActive) return;
  if (typeof window === 'undefined') return;

  guardActive = true;

  originalFetch = globalThis.fetch;
  globalThis.fetch = function blockedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const v = recordViolation(init?.method ?? 'GET', url);
    if (mode === 'block') {
      throw new Error(
        `[PromptNotes Network Guard] Outbound network request detected and blocked: ${v.method} ${v.url}. ` +
          `PromptNotes must not perform any network communication.`,
      );
    }
    return Promise.reject(
      new Error(`Network communication is denied by PromptNotes security policy.`),
    );
  };

  originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function blockedOpen(
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ): void {
    const urlStr = typeof url === 'string' ? url : url.href;
    const v = recordViolation(method, urlStr);
    if (mode === 'block') {
      throw new Error(
        `[PromptNotes Network Guard] XMLHttpRequest detected and blocked: ${v.method} ${v.url}. ` +
          `PromptNotes must not perform any network communication.`,
      );
    }
    return originalXhrOpen!.call(this, method, url, ...(rest as [boolean?, string?, string?]));
  };
}

/**
 * Removes the network guard and restores original implementations.
 */
export function uninstallNetworkGuard(): void {
  if (!guardActive) return;
  if (originalFetch) globalThis.fetch = originalFetch;
  if (originalXhrOpen) XMLHttpRequest.prototype.open = originalXhrOpen;
  originalFetch = null;
  originalXhrOpen = null;
  guardActive = false;
}

/**
 * Returns all recorded network violations.
 */
export function getNetworkViolations(): readonly NetworkViolation[] {
  return violations;
}

/**
 * Clears recorded violations.
 */
export function clearNetworkViolations(): void {
  violations.length = 0;
}
