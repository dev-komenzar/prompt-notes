// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `search_notes` のフィルタ組み合わせテスト
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @generated-by: codd implement --sprint 26

import { invoke } from "@tauri-apps/api/core";

interface CreateNoteOptions {
  tags: string[];
  body: string;
}

export async function createTestNote(opts: CreateNoteOptions): Promise<string> {
  const { filename } = await invoke<{ filename: string }>("create_note");
  await invoke("save_note", {
    filename,
    frontmatter: { tags: opts.tags },
    body: opts.body,
  });
  return filename;
}

export async function deleteTestNote(filename: string): Promise<void> {
  await invoke("delete_note", { filename });
}

export function formatDateOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

let tagCounter = 0;
export function uniqueTag(prefix: string): string {
  tagCounter += 1;
  return `${prefix}-${Date.now()}-${tagCounter}`;
}
