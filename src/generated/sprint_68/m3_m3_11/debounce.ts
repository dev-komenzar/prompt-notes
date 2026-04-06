// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 68-1
// @task-title: M3（M3-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=68, task=68-1, module=module:editor, oq=OQ-004
// Generic debounce utility per component_architecture §3.4 (lib/debounce.ts)

/**
 * A debounced function wrapper with explicit flush and cancel controls.
 * Used by the auto-save manager to coalesce rapid editor changes into
 * a single IPC save_note call after the configured debounce interval.
 */
export interface DebouncedFn<T extends (...args: unknown[]) => unknown> {
  /** Invoke the debounced function. Resets the timer on each call. */
  (...args: Parameters<T>): void;
  /** Immediately execute the pending call if one exists. Returns the result. */
  flush(): ReturnType<T> | undefined;
  /** Cancel any pending invocation without executing. */
  cancel(): void;
  /** Whether a call is currently pending. */
  readonly pending: boolean;
}

/**
 * Creates a debounced wrapper around `fn`.
 *
 * @param fn - The function to debounce.
 * @param delayMs - Debounce interval in milliseconds.
 * @param maxWaitMs - Optional maximum wait time before forced execution.
 *                    0 or undefined disables the max-wait behavior.
 * @returns A DebouncedFn wrapper.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number,
  maxWaitMs?: number,
): DebouncedFn<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let maxTimerId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let firstCallTimestamp = 0;

  const effectiveMaxWait = maxWaitMs && maxWaitMs > 0 ? maxWaitMs : 0;

  function invoke(): ReturnType<T> | undefined {
    clearTimers();
    if (lastArgs !== null) {
      const args = lastArgs;
      lastArgs = null;
      firstCallTimestamp = 0;
      return fn(...args) as ReturnType<T>;
    }
    return undefined;
  }

  function clearTimers(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (maxTimerId !== null) {
      clearTimeout(maxTimerId);
      maxTimerId = null;
    }
  }

  const debounced = function (this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;

    if (timerId !== null) {
      clearTimeout(timerId);
    }

    if (effectiveMaxWait > 0 && firstCallTimestamp === 0) {
      firstCallTimestamp = Date.now();
      maxTimerId = setTimeout(() => {
        invoke();
      }, effectiveMaxWait);
    }

    timerId = setTimeout(() => {
      invoke();
    }, delayMs);
  } as DebouncedFn<T>;

  debounced.flush = (): ReturnType<T> | undefined => {
    return invoke();
  };

  debounced.cancel = (): void => {
    clearTimers();
    lastArgs = null;
    firstCallTimestamp = 0;
  };

  Object.defineProperty(debounced, 'pending', {
    get(): boolean {
      return lastArgs !== null;
    },
    enumerable: true,
  });

  return debounced;
}
