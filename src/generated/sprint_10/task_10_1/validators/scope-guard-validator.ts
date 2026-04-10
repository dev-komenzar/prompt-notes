// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --wave 10

export interface ScopeGuardResult {
  readonly id: string;
  readonly violated: boolean;
  readonly description: string;
}

export interface DomScopeGuardInput {
  readonly hasTitleInput: boolean;
  readonly hasRenderedMarkdownElements: boolean;
  readonly hasNetworkCalls: boolean;
  readonly hasExternalApiFetch: boolean;
}

export function checkEditorScopeGuards(
  input: DomScopeGuardInput,
): readonly ScopeGuardResult[] {
  return [
    {
      id: 'SG-TITLE',
      violated: input.hasTitleInput,
      description:
        'タイトル入力欄（input/textarea）がエディタ画面に存在してはならない',
    },
    {
      id: 'SG-RENDER',
      violated: input.hasRenderedMarkdownElements,
      description:
        'Markdown レンダリング済み HTML 要素（h1, strong, em 等）が本文領域に存在してはならない',
    },
    {
      id: 'SG-NETWORK',
      violated: input.hasNetworkCalls,
      description:
        'ネットワーク通信（fetch, XMLHttpRequest）が発生してはならない',
    },
    {
      id: 'SG-AI',
      violated: input.hasExternalApiFetch,
      description: '外部 AI API 呼び出しが存在してはならない',
    },
  ] as const;
}

export function hasScopeViolation(
  results: readonly ScopeGuardResult[],
): boolean {
  return results.some((r) => r.violated);
}
