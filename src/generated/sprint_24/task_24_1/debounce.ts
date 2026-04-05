// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Debounce Utility
// Used by module:editor (auto-save, 500ms) and module:grid (search input, 300ms).

export interface DebouncedFn<A extends unknown[]> {
  (...args: A): void;
  /** Immediately execute pending invocation if one exists, then clear timer. */
  flush(): void;
  /** Cancel pending invocation without executing. */
  cancel(): void;
  /** Whether a debounced call is currently pending. */
  readonly pending: boolean;
}

/**
 * Creates a debounced version of `fn` that delays invocation until `delayMs`
 * milliseconds have elapsed since the last call. Subsequent calls within the
 * delay window reset the timer.
 *
 * The returned function exposes `flush()` to force immediate execution of any
 * pending call (critical for note switching and component teardown to prevent
 * data loss), and `cancel()` to discard a pending call.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): DebouncedFn<A> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: A | null = null;

  const debounced = ((...args: A): void => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      const args = latestArgs;
      latestArgs = null;
      if (args !== null) {
        fn(...args);
      }
    }, delayMs);
  }) as DebouncedFn<A>;

  debounced.flush = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (latestArgs !== null) {
      const args = latestArgs;
      latestArgs = null;
      fn(...args);
    }
  };

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  };

  Object.defineProperty(debounced, 'pending', {
    get(): boolean {
      return timerId !== null;
    },
    enumerable: true,
  });

  return debounced;
}
