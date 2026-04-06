// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=48, task=48-1, module=debounce
// Generic debounce utility used by module:editor (auto-save) and module:grid (search).

/**
 * Creates a debounced version of the given callback.
 *
 * While the debounced function is called repeatedly, the underlying callback
 * is only invoked once the calls stop for at least `delayMs` milliseconds.
 *
 * The returned object exposes:
 * - `call(...args)` – schedule / reschedule execution
 * - `flush()` – execute immediately if a call is pending (idempotent)
 * - `cancel()` – cancel any pending execution without invoking the callback
 *
 * @param callback  The function to debounce.
 * @param delayMs   Delay in milliseconds.
 */
export function createDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void | Promise<void>,
  delayMs: number,
): DebouncedFn<Args> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Args | null = null;

  const flush = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (latestArgs !== null) {
      const args = latestArgs;
      latestArgs = null;
      callback(...args);
    }
  };

  const cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  };

  const call = (...args: Args): void => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(flush, delayMs);
  };

  return { call, flush, cancel };
}

/** Public interface of the debounced wrapper returned by `createDebounce`. */
export interface DebouncedFn<Args extends unknown[]> {
  /** Schedule (or reschedule) execution with the given arguments. */
  call: (...args: Args) => void;
  /** Execute immediately if a pending call exists; no-op otherwise. */
  flush: () => void;
  /** Cancel any pending execution without invoking the callback. */
  cancel: () => void;
}
