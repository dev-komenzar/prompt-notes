// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: ファイル名生成 → frontmatter テンプレート（空 `tags`）付き `.md` ファイル作成 → `{filename}` 返却
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 14
// @task: 14-1

/**
 * Frontmatter structure for PromptNotes .md files.
 * Only `tags` field is permitted per NNC-S2.
 */
export interface Frontmatter {
  tags: string[];
}

/**
 * Result returned by the `create_note` Tauri IPC command.
 */
export interface CreateNoteResult {
  filename: string;
  path: string;
}

/**
 * Result returned by the `save_note` Tauri IPC command.
 */
export interface SaveResult {
  success: boolean;
}

/**
 * Metadata for a single note, mirroring the Rust `NoteMetadata` struct.
 * Canonical definition lives in `src-tauri/src/storage/types.rs`.
 */
export interface NoteMetadata {
  filename: string;
  tags: string[];
  body_preview: string;
  created_at: string;
}
