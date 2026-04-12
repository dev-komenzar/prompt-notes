// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 64-1
// @task-title: 2 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md

import { writable } from 'svelte/store';
import type { NoteMetadata } from '../types';

/** ノート一覧。editor と grid の両モジュールが購読する。書き込みは IPC 応答受信時のみ。 */
export const notesStore = writable<NoteMetadata[]>([]);

/** エディタ画面で現在選択・編集中のノート ID */
export const selectedNoteId = writable<string | null>(null);
