// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-3
// @task-title: :filename` へ即時リダイレクト
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { goto } from '$app/navigation';
import { invoke } from '@tauri-apps/api/core';
import type { CreateNoteResult } from '../edit/redirect';

/**
 * Invokes create_note IPC command and immediately redirects to /edit/:filename.
 * This is the core logic for the /new route: no independent view, just redirect.
 */
export async function redirectToNewNote(): Promise<void> {
  const result = await invoke<CreateNoteResult>('create_note');
  await goto(`/edit/${encodeURIComponent(result.filename)}`);
}
