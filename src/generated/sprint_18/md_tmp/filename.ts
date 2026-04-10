// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: ディレクトリ走査 → `.md` ファイルのみ対象（`.tmp` 除外
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}

export function isTmpFile(filename: string): boolean {
  return filename.endsWith('.tmp');
}

export function isMdFile(filename: string): boolean {
  return filename.endsWith('.md');
}

export function parseCreatedAt(filename: string): string {
  // "2026-04-10T091530.md" → "2026-04-10T09:15:30"
  const base = filename.replace(/\.md$/, '');
  const datePart = base.slice(0, 10);
  const timePart = base.slice(11);
  const hh = timePart.slice(0, 2);
  const mm = timePart.slice(2, 4);
  const ss = timePart.slice(4, 6);
  return `${datePart}T${hh}:${mm}:${ss}`;
}
