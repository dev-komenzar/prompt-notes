// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md, docs/detailed_design/storage_fileformat_design.md
// @sprint: 20
// @task: 20-1 module:settings — configStore Svelte writable ストア

import { writable } from 'svelte/store';
import type { AppConfig } from '$lib/types';
import { getConfig, setConfig } from '$lib/ipc';

function createConfigStore() {
  const { subscribe, set, update } = writable<AppConfig>({ notes_dir: '' });

  return {
    subscribe,

    /** アプリ起動時または SettingsView マウント時に Rust バックエンドから設定を読み込む */
    async init(): Promise<void> {
      const config = await getConfig();
      set(config);
    },

    /**
     * 保存ディレクトリを変更する。
     * Rust バックエンド経由で config.json を更新し、ストアを同期する。
     * フロントエンド単独でのファイルパス操作は禁止 (module:settings 制約)。
     */
    async setNotesDir(notesDir: string): Promise<void> {
      const newConfig: AppConfig = { notes_dir: notesDir };
      await setConfig(newConfig);
      set(newConfig);
    },
  };
}

export const configStore = createConfigStore();
