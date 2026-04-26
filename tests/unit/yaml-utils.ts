// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `serde_yaml` による YAML 解析。`Frontmatter` 構造体（`tags: Vec<String>`, `extra: serde_yaml::Mapping`）でラウンドトリップ保全。frontmatter 不在時は `tags: []` として扱う。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/feed_search_design.md (detail:feed_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 13
// @task: 13-1
// Minimal YAML parse/stringify utilities wrapping js-yaml for frontmatter use.

import jsYaml from 'js-yaml';

/**
 * Parse a YAML string into a JS object. Returns null on failure.
 */
export function parseYaml(yamlStr: string): unknown {
  try {
    return jsYaml.load(yamlStr) ?? null;
  } catch {
    return null;
  }
}

/**
 * Stringify a JS object to YAML. Uses flow style for arrays to match
 * common frontmatter conventions (e.g. `tags: [gpt, coding]`).
 */
export function stringifyYaml(obj: Record<string, unknown>): string {
  return jsYaml.dump(obj, {
    flowLevel: 1,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}
