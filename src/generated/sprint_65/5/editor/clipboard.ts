// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 5 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 65 | task: 65-1 | module: editor
// 1-click copy is the core UX. Must copy body only (no frontmatter). (RB-1)

import type { CopyStatus } from '../types';

const COPY_FEEDBACK_MS = 1500;
const ERROR_FEEDBACK_MS = 500;

export async function copyBodyToClipboard(
  body: string,
  onStatus: (s: CopyStatus) => void
): Promise<void> {
  try {
    await navigator.clipboard.writeText(body);
    onStatus('copied');
    setTimeout(() => onStatus('idle'), COPY_FEEDBACK_MS);
  } catch (err) {
    console.error('[clipboard] copy failed', err);
    onStatus('error');
    setTimeout(() => onStatus('idle'), ERROR_FEEDBACK_MS);
  }
}
