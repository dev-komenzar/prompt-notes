// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Debounce utility
// Used by module:editor auto-save (500ms) and module:grid search (300ms).
// Timer management is frontend-side; Rust backend is stateless.
// Sprint 15 · M2-03 · read_note IPC コマンド実装

export interface DebouncedFn<T extends (...args: never[]) => unknown> {
  /** Invoke the debounced function; resets the timer on each call. */
  (...args: Parameters<T>): void;
  /** Cancel any pending invocation without executing the callback. */
  cancel(): void;
  /** If a call is pending, execute it immediately and clear the timer. */
  flush(): void;
  /** Whether a call is currently pending. */
  readonly pending: boolean;
}

/**
 * Creates a debounced version of `fn` that delays invocation until
 * `delayMs` milliseconds have elapsed since the last call.
 *
 * @param fn       The function to debounce.
 * @param delayMs  Delay in milliseconds (e.g. 500 for auto-save, 300 for search).
 * @returns        A debounced wrapper with cancel/flush helpers.
 */
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delayMs: number,
): DebouncedFn<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const execute = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingArgs !== null) {
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  };

  const debounced = ((...args: Parameters<T>): void => {
    pendingArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(execute, delayMs);
  }) as DebouncedFn<T>;

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  debounced.flush = (): void => {
    execute();
  };

  Object.defineProperty(debounced, 'pending', {
    get(): boolean {
      return timeoutId !== null;
    },
    enumerable: true,
  });

  return debounced;
}
