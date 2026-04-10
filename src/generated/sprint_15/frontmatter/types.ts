// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: ファイル読み込み → frontmatter
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 15
// @task: 15-1

/**
 * Frontmatter structure for a note file.
 * Only `tags` field is permitted per NNC-S2.
 */
export interface Frontmatter {
  tags: string[];
  /** Preserved unknown fields for round-trip fidelity. */
  extra: Record<string, unknown>;
}

/**
 * Metadata extracted from a note file.
 * Canonical definition mirrors Rust `NoteMetadata` in module:storage.
 */
export interface NoteMetadata {
  filename: string;
  tags: string[];
  created_at: string;
  body_preview: string;
}

/**
 * Complete note data returned by read_note.
 */
export interface NoteData {
  metadata: NoteMetadata;
  body: string;
}
