// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 34-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:34 task:34-1 module:editor
// CoDD trace: detail:editor_clipboard, detail:storage_fileformat → plan:implementation_plan
// Convention 11: 自動保存必須。ユーザーによる明示的保存操作は不要。
// Debounce interval: 500ms (OQ-004 baseline value).

import { EditorView } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { debounce } from './debounce';
import type { DebouncedFunction } from './debounce';

export const AUTO_SAVE_DEBOUNCE_MS = 500;

export interface AutoSaveConfig {
  /** Async function that persists content via IPC save_note. */
  onSave: (content: string) => Promise<void>;
  /** Override default debounce interval (ms). */
  debounceMs?: number;
  /** Called when a save operation begins. */
  onSaveStart?: () => void;
  /** Called when a save operation completes (success or error). */
  onSaveEnd?: () => void;
  /** Called when a save operation fails. */
  onSaveError?: (error: Error) => void;
}

export interface AutoSaveHandle {
  /** CM6 extension to register on the EditorView. */
  extension: ReturnType<typeof EditorView.updateListener.of>;
  /** Immediately flush any pending save. */
  flush: () => void;
  /** Cancel any pending save without executing it. */
  cancel: () => void;
  /** Returns true if a save is pending. */
  pending: () => boolean;
}

/**
 * Creates the auto-save CM6 extension and control handle.
 * Listens to EditorView.updateListener for docChanged events,
 * debounces, then calls onSave with the full document content.
 */
export function createAutoSave(config: AutoSaveConfig): AutoSaveHandle {
  const ms = config.debounceMs ?? AUTO_SAVE_DEBOUNCE_MS;

  const performSave = async (content: string): Promise<void> => {
    config.onSaveStart?.();
    try {
      await config.onSave(content);
    } catch (err) {
      config.onSaveError?.(
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      config.onSaveEnd?.();
    }
  };

  const debouncedSave: DebouncedFunction<(content: string) => void> =
    debounce((content: string) => {
      void performSave(content);
    }, ms);

  const extension = EditorView.updateListener.of(
    (update: ViewUpdate) => {
      if (!update.docChanged) return;
      debouncedSave(update.state.doc.toString());
    },
  );

  return {
    extension,
    flush: () => debouncedSave.flush(),
    cancel: () => debouncedSave.cancel(),
    pending: () => debouncedSave.pending(),
  };
}
