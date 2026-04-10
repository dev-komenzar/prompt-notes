// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `read_note` でノート読み込み → CodeMirror にセット → 自動保存有効化
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=35 task=35-1 module=editor
// NNC-E4: Cmd+N / Ctrl+N must create a new note and move focus — release blocker
import { goto } from '$app/navigation';
import { invoke } from '@tauri-apps/api/core';

const isMac =
  typeof navigator !== 'undefined' &&
  /mac/i.test(navigator.platform);

export function registerGlobalKeybindings(): () => void {
  const handler = async (e: KeyboardEvent) => {
    const trigger = isMac ? e.metaKey : e.ctrlKey;
    if (trigger && e.key === 'n') {
      e.preventDefault();
      try {
        const { filename } = await invoke<{ filename: string }>('create_note');
        await goto(`/edit/${encodeURIComponent(filename)}`);
      } catch (err) {
        console.error('[keybindings] create_note failed:', err);
      }
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}
