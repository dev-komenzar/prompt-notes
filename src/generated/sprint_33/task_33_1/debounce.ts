// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 33-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=33, task=33-1, module=shared, node=detail:editor_clipboard
// Generic debounce utility used by module:editor (auto-save 500 ms)
// and module:grid (search input 300 ms).

/**
 * Creates a debounced version of the provided callback.
 *
 * While the debounced function is called repeatedly within the delay window,
 * only the *last* invocation will actually execute after the delay elapses.
 *
 * @param callback  The function to debounce.
 * @param delayMs   Delay in milliseconds before the callback fires.
 * @returns An object with:
 *   - `call(...args)` — schedule (or reschedule) the callback
 *   - `flush()`       — execute the pending callback immediately (if any)
 *   - `cancel()`      — cancel the pending callback without executing it
 */
export function createDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void | Promise<void>,
  delayMs: number,
): {
  call: (...args: Args) => void;
  flush: () => void;
  cancel: () => void;
} {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  function cancel(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    pendingArgs = null;
  }

  function flush(): void {
    if (timerId !== null && pendingArgs !== null) {
      clearTimeout(timerId);
      timerId = null;
      const args = pendingArgs;
      pendingArgs = null;
      callback(...args);
    }
  }

  function call(...args: Args): void {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    pendingArgs = args;
    timerId = setTimeout(() => {
      timerId = null;
      const a = pendingArgs;
      pendingArgs = null;
      if (a !== null) {
        callback(...a);
      }
    }, delayMs);
  }

  return { call, flush, cancel };
}
