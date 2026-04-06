// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 74-1
// @task-title: M4（M4-04）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 74 · M4-04 · OQ-SF-002: body_preview 文字数上限
// Public API for body_preview utilities.

export {
  BODY_PREVIEW_MAX_LENGTH,
  BODY_PREVIEW_MIN_LENGTH,
  TRUNCATION_ELLIPSIS,
} from "./constants";

export type { NoteEntry, BodyPreviewConfig } from "./types";

export { splitFrontmatter, stripFrontmatter } from "./frontmatter";
export type { FrontmatterSplitResult } from "./frontmatter";

export { truncatePreview } from "./truncate";

export {
  extractBodyPreview,
  isValidBodyPreview,
  bodyPreviewDisplayLength,
} from "./body-preview";
