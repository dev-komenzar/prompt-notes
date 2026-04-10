// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `serde_yaml` による YAML 解析。`Frontmatter` 構造体（`tags: Vec<String>`, `extra: serde_yaml::Mapping`）でラウンドトリップ保全。frontmatter 不在時は `tags: []` として扱う。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 13
// @task: 13-1
// Public API for frontmatter module.

export type { Frontmatter } from './frontmatter';
export {
  parseFrontmatter,
  serializeFrontmatter,
  createEmptyFrontmatter,
  splitRaw,
} from './frontmatter';
