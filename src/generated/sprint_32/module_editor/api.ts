// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:component_architecture §3.4, detail:editor_clipboard §4.6
// All file operations go through Tauri IPC. Direct filesystem access is prohibited (CONV-1).

import { invoke } from "@tauri-apps/api/core";
import type { CreateNoteResponse, ReadNoteResponse } from "./types";

/**
 * Creates a new note via module:storage (Rust backend).
 * Filename (YYYY-MM-DDTHHMMSS.md) is generated exclusively by Rust/chrono.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>("create_note");
}

/**
 * Saves note content via module:storage.
 * Content includes frontmatter + body. Rust side performs stateless overwrite.
 */
export async function saveNote(
  filename: string,
  content: string
): Promise<void> {
  await invoke<void>("save_note", { filename, content });
}

/**
 * Reads note content via module:storage.
 * Used when navigating from grid view to editor (Sprint 32 core feature).
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  return invoke<ReadNoteResponse>("read_note", { filename });
}

/**
 * Deletes a note via module:storage.
 */
export async function deleteNote(filename: string): Promise<void> {
  await invoke<void>("delete_note", { filename });
}
