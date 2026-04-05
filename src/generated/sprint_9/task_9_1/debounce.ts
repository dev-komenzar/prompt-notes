// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=9, task=9-1, module=shared, file=debounce.ts
// Design refs: detail:component_architecture §4.2, detail:editor_clipboard §4.5, detail:grid_search §4.2

/**
 * Return type of the debounce function, exposing cancel and flush controls.
 * Used by module:editor (auto-save 500ms) and module:grid (search 300ms).
 */
export interface DebouncedFn<T extends (...args: unknown[]) => unknown> {
  /** Invoke the debounced function – resets the timer on each call. */
  (...args: Parameters<T>): void;
  /** Cancel a pending invocation without executing the callback. */
  cancel(): void;
  /**
   * If a call is pending, execute it immediately and clear the timer.
   * Returns the result of the callback (may be a Promise for async fns).
   * Returns undefined when nothing is pending.
   */
  flush(): ReturnType<T> | undefined;
  /** Whether a call is currently pending. */
  readonly pending: boolean;
}

/**
 * Creates a debounced version of `fn` that delays invocation until `delayMs`
 * milliseconds have elapsed since the last call.
 *
 * Design contract (detail:editor_clipboard §4.5):
 *  - Auto-save: EditorView.updateListener triggers debounce(500ms), then
 *    invokes saveNote IPC. On unmount / note-switch, flush() is called to
 *    persist unsaved changes immediately.
 *  - Search: GridView search input triggers debounce(300ms), then invokes
 *    searchNotes IPC.
 *
 * @param fn       The function to debounce. May be sync or async.
 * @param delayMs  Delay in milliseconds (e.g. 500 for auto-save, 300 for search).
 * @returns        A debounced wrapper with cancel / flush / pending API.
 */
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delayMs: number,
): DebouncedFn<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  function clear(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  }

  const debounced = function (this: unknown, ...args: Parameters<T>): void {
    latestArgs = args;

    if (timerId !== null) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      timerId = null;
      const savedArgs = latestArgs;
      latestArgs = null;
      if (savedArgs !== null) {
        fn.apply(this, savedArgs);
      }
    }, delayMs);
  } as DebouncedFn<T>;

  debounced.cancel = clear;

  debounced.flush = function (): ReturnType<T> | undefined {
    if (timerId === null || latestArgs === null) {
      return undefined;
    }
    const savedArgs = latestArgs;
    clear();
    return fn(...savedArgs) as ReturnType<T>;
  };

  Object.defineProperty(debounced, 'pending', {
    get(): boolean {
      return timerId !== null;
    },
    enumerable: true,
  });

  return debounced;
}
