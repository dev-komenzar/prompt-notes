// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-3
// @task-title: `http` プラグイン `deny`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_4 > task_4-3 > fetch-interceptor
// implements: runtime fetch/XMLHttpRequest interception for http deny enforcement

export interface FetchViolation {
  readonly timestamp: number;
  readonly url: string;
  readonly method: string;
  readonly source: 'fetch' | 'xmlhttprequest';
  readonly blocked: true;
}

let violations: FetchViolation[] = [];
let originalFetch: typeof globalThis.fetch | null = null;
let originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
let installed = false;

function recordViolation(
  url: string,
  method: string,
  source: FetchViolation['source'],
): FetchViolation {
  const violation: FetchViolation = Object.freeze({
    timestamp: Date.now(),
    url,
    method,
    source,
    blocked: true,
  });
  violations.push(violation);
  return violation;
}

/**
 * Installs fetch and XMLHttpRequest interceptors that block all outbound
 * HTTP requests from the WebView process. This is a defense-in-depth
 * measure complementing the tauri.conf.json http plugin deny setting.
 *
 * Allowed origins (localhost/tauri asset protocol) are excluded from blocking
 * to permit normal Tauri IPC and dev-server operation.
 */
export function installFetchInterceptor(): void {
  if (installed) return;

  if (typeof globalThis.fetch === 'function') {
    originalFetch = globalThis.fetch;
    globalThis.fetch = function blockedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (isAllowedOrigin(url)) {
        return originalFetch!.call(globalThis, input, init);
      }
      const method = init?.method ?? 'GET';
      recordViolation(url, method, 'fetch');
      return Promise.reject(
        new TypeError(
          `[promptnotes] Network request blocked: ${method} ${url}. PromptNotes does not perform network communication.`,
        ),
      );
    };
  }

  if (typeof XMLHttpRequest !== 'undefined') {
    originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function blockedOpen(
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ): void {
      const urlStr = typeof url === 'string' ? url : url.href;
      if (isAllowedOrigin(urlStr)) {
        return originalXhrOpen!.apply(this, [method, url, ...rest] as Parameters<typeof XMLHttpRequest.prototype.open>);
      }
      recordViolation(urlStr, method, 'xmlhttprequest');
      throw new Error(
        `[promptnotes] Network request blocked: ${method} ${urlStr}. PromptNotes does not perform network communication.`,
      );
    };
  }

  installed = true;
}

/**
 * Uninstalls fetch and XMLHttpRequest interceptors, restoring original behavior.
 */
export function uninstallFetchInterceptor(): void {
  if (!installed) return;

  if (originalFetch !== null) {
    globalThis.fetch = originalFetch;
    originalFetch = null;
  }

  if (originalXhrOpen !== null && typeof XMLHttpRequest !== 'undefined') {
    XMLHttpRequest.prototype.open = originalXhrOpen;
    originalXhrOpen = null;
  }

  installed = false;
}

export function isFetchInterceptorInstalled(): boolean {
  return installed;
}

export function getFetchViolations(): ReadonlyArray<FetchViolation> {
  return [...violations];
}

export function clearFetchViolations(): void {
  violations = [];
}

/**
 * Checks whether a URL is an allowed origin for Tauri IPC and dev-server.
 * Only localhost, 127.0.0.1, and tauri protocol URLs are permitted.
 */
function isAllowedOrigin(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://localhost');
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return true;
    }
    if (parsed.protocol === 'tauri:' || parsed.protocol === 'ipc:' || parsed.protocol === 'asset:') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
