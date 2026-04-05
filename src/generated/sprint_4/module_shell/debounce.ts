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

// CoDD Trace: sprint:4 task:4-1 module:shell file:debounce.ts
// Generic debounce utility used by module:editor (auto-save 500ms)
// and module:grid (search input 300ms).

/**
 * Handle returned by debounce(). Provides explicit control over
 * the pending invocation.
 */
export interface DebouncedFn<A extends unknown[]> {
  /** Call the debounced function. Resets the timer on each invocation. */
  (...args: A): void;
  /** Cancel any pending invocation without executing the callback. */
  cancel(): void;
  /** If a call is pending, execute it immediately and clear the timer. */
  flush(): void;
}

/**
 * Create a debounced version of the given callback.
 *
 * - Each call resets the delay timer.
 * - `cancel()` discards a pending call.
 * - `flush()` executes a pending call immediately (used on unmount / note switch
 *   to guarantee unsaved changes are persisted).
 *
 * @param callback - The function to debounce
 * @param delayMs  - Delay in milliseconds (500 for auto-save, 300 for search)
 */
export function debounce<A extends unknown[]>(
  callback: (...args: A) => void,
  delayMs: number,
): DebouncedFn<A> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: A | null = null;

  const cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  };

  const flush = (): void => {
    if (timerId !== null && latestArgs !== null) {
      clearTimeout(timerId);
      timerId = null;
      const args = latestArgs;
      latestArgs = null;
      callback(...args);
    }
  };

  const debounced = (...args: A): void => {
    latestArgs = args;

    if (timerId !== null) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      timerId = null;
      const a = latestArgs;
      latestArgs = null;
      if (a !== null) {
        callback(...a);
      }
    }, delayMs);
  };

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}
