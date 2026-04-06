// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > detail:editor_clipboard > detail:grid_search

/**
 * Creates a debounced version of the provided callback.
 * Used by:
 *   - module:editor auto-save (500ms) — CONV-AUTOSAVE
 *   - module:grid search input (300ms)
 *
 * The debounced function resets its timer on every invocation.
 * It also exposes a flush() method to force immediate execution of any pending call
 * (used during note switching and component teardown to prevent data loss).
 */
export interface DebouncedFn<Args extends unknown[]> {
  (...args: Args): void;
  /** Force-execute any pending invocation immediately. */
  flush(): void;
  /** Cancel any pending invocation without executing. */
  cancel(): void;
  /** True if a timer is currently pending. */
  readonly pending: boolean;
}

export function debounce<Args extends unknown[]>(
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

  const debounced = ((...args: Args): void => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      if (latestArgs !== null) {
        const a = latestArgs;
        latestArgs = null;
        callback(...a);
      }
    }, delayMs);
  }) as DebouncedFn<Args>;

  Object.defineProperty(debounced, 'pending', {
    get: () => timerId !== null,
    enumerable: true,
  });
  debounced.flush = flush;
  debounced.cancel = cancel;

  return debounced;
}
