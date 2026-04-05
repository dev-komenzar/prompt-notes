// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:shell – Debounce utility
// Sprint 3 – Tauri v2 (OQ-005 resolved)
// Used by: module:editor (auto-save, 500ms), module:grid (search, 300ms)
// Ref: detail:component_architecture §4.2, detail:editor_clipboard §4.5

/**
 * A debounced function with cancel, flush, and pending-check capabilities.
 * flush() is async to support awaiting the underlying async operation
 * (critical for window-close save flush).
 */
export interface Debounced<Args extends unknown[]> {
  /** Schedule the function to execute after the debounce delay. Resets timer on each call. */
  (...args: Args): void;
  /** Cancel the pending execution without invoking the function. */
  cancel(): void;
  /** Execute the pending call immediately. Returns a Promise so callers can await completion. */
  flush(): Promise<void>;
  /** Returns true if there is a pending debounced call. */
  pending(): boolean;
}

/**
 * Creates a debounced version of `fn`.
 *
 * @param fn        The function to debounce. May be sync or async.
 * @param delayMs   Milliseconds to wait after the last invocation before executing.
 *
 * @example
 * ```ts
 * const debouncedSave = debounce(async () => {
 *   await saveNote({ filename, content });
 * }, 500);
 *
 * // In EditorView.updateListener:
 * if (update.docChanged) debouncedSave();
 *
 * // On window close or note switch:
 * await debouncedSave.flush();
 * ```
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void | Promise<void>,
  delayMs: number,
): Debounced<Args> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  async function execute(args: Args): Promise<void> {
    await fn(...args);
  }

  const debounced = ((...args: Args): void => {
    pendingArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      const args = pendingArgs;
      pendingArgs = null;
      if (args !== null) {
        execute(args).catch((err: unknown) => {
          // Error propagation for fire-and-forget calls is handled by
          // the wrapped function itself (e.g., IpcError logging).
          // Re-throwing here would be an unhandled rejection.
          console.error('[debounce] Async execution error:', err);
        });
      }
    }, delayMs);
  }) as Debounced<Args>;

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  debounced.flush = async (): Promise<void> => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingArgs !== null) {
      const args = pendingArgs;
      pendingArgs = null;
      await execute(args);
    }
  };

  debounced.pending = (): boolean => {
    return timeoutId !== null;
  };

  return debounced;
}
