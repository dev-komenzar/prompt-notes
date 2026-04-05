// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD trace: plan:implementation_plan > sprint:1 > task:1-1
// Debounce utility using setTimeout / clearTimeout.
// Used by module:editor (auto-save 500ms) and module:grid (search 300ms).

/**
 * Return type of createDebouncedFn.
 */
export interface DebouncedFn<Args extends unknown[]> {
  /** Schedule the function to execute after the debounce delay. Resets timer on each call. */
  call(...args: Args): void;
  /** Immediately execute any pending invocation. Returns a Promise that resolves when the function completes. */
  flush(): Promise<void>;
  /** Cancel any pending invocation without executing. */
  cancel(): void;
  /** Returns true if there is a pending invocation waiting to fire. */
  isPending(): boolean;
}

/**
 * Creates a debounced wrapper around a (possibly async) function.
 *
 * - `call()` resets the delay timer on every invocation; the wrapped function
 *   fires only after `delayMs` of inactivity.
 * - `flush()` immediately executes any pending call and awaits its completion.
 *   Essential for module:editor onDestroy / window close to persist unsaved edits.
 * - `cancel()` discards the pending call without executing.
 *
 * @param fn      - The function to debounce (may return void or Promise<void>)
 * @param delayMs - Debounce delay in milliseconds
 *
 * @example
 * ```ts
 * const autoSave = createDebouncedFn(
 *   async (filename: string, content: string) => {
 *     await saveNote(filename, content);
 *   },
 *   500
 * );
 *
 * // On document change:
 * autoSave.call(currentFilename, editorContent);
 *
 * // On component destroy:
 * await autoSave.flush();
 * ```
 */
export function createDebouncedFn<Args extends unknown[]>(
  fn: (...args: Args) => void | Promise<void>,
  delayMs: number,
): DebouncedFn<Args> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  function call(...args: Args): void {
    pendingArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (pendingArgs !== null) {
        const captured = pendingArgs;
        pendingArgs = null;
        fn(...captured);
      }
    }, delayMs);
  }

  async function flush(): Promise<void> {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingArgs !== null) {
      const captured = pendingArgs;
      pendingArgs = null;
      await fn(...captured);
    }
  }

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  }

  function isPending(): boolean {
    return pendingArgs !== null;
  }

  return { call, flush, cancel, isPending };
}
