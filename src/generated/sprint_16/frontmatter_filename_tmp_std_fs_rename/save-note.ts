// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 16-1
// @task-title: frontmatter シリアライズ + 本文結合 → `.{filename}.tmp` に書き込み → `std::fs::rename()` でアトミック置換
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// Sprint 16 Task 16-1: save_note atomic write — IPC call layer
//
// Rust backend performs:
//   1. Serialize frontmatter (tags) to YAML
//   2. Concatenate frontmatter + "\n" + body
//   3. Write to .{filename}.tmp in notes_dir
//   4. std::fs::rename() for atomic replacement
//
// Frontend only passes filename + structured data; path resolution and
// atomic write are exclusively owned by module:storage (Rust).

import { invoke } from '@tauri-apps/api/core';
import type { Frontmatter, SaveNoteParams, SaveNoteResult } from './types';

export async function saveNote(
  filename: string,
  frontmatter: Frontmatter,
  body: string,
): Promise<SaveNoteResult> {
  const params: SaveNoteParams = { filename, frontmatter, body };
  return invoke<SaveNoteResult>('save_note', params);
}
