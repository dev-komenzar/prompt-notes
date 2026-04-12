// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md §4.2, §4.5
// @sprint: 10 — atomic_write() implementation
//
// Debounced autosave pipeline (500ms).
// The Rust save_note command performs atomic_write internally:
//   write {id}.md.tmp → std::fs::rename → {id}.md
// This module owns the debounce timer and invokes saveNote via IPC.

import { saveNote } from './ipc';
import type { Frontmatter } from './types';

export type GetBodyFn = () => string;
export type GetFrontmatterFn = () => Frontmatter;

export class AutosavePipeline {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number;

  constructor(debounceMs = 500) {
    this.debounceMs = debounceMs;
  }

  schedule(
    noteId: string,
    getBody: GetBodyFn,
    getFrontmatter: GetFrontmatterFn,
  ): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      const body = getBody();
      const frontmatter = getFrontmatter();
      saveNote(noteId, frontmatter, body).catch((err) => {
        console.error('[autosave] save_note failed:', err);
      });
    }, this.debounceMs);
  }

  flush(
    noteId: string,
    getBody: GetBodyFn,
    getFrontmatter: GetFrontmatterFn,
  ): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    return saveNote(noteId, getFrontmatter(), getBody());
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
