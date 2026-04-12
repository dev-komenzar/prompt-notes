// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: `module:settings` + `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd: detail:storage_fileformat §4.4 / detail:component_architecture §3.5
// configStore: 書き込み権限は settings のみ。起動時に get_config で初期化する。

import { writable } from 'svelte/store';
import type { AppConfig } from './types';
import { getConfig, setConfig } from './ipc';

function createConfigStore() {
  const { subscribe, set, update } = writable<AppConfig | null>(null);

  return {
    subscribe,

    /** アプリ起動時に Rust バックエンドから設定を読み込む */
    async init(): Promise<void> {
      const config = await getConfig();
      set(config);
    },

    /**
     * 保存ディレクトリを変更する。
     * - Rust バックエンド経由で config.json に永続化する（RBC: フロントエンド単独でのパス操作禁止）
     * - 既存ノートの移動は行わない
     */
    async changeNotesDir(newDir: string): Promise<void> {
      const config: AppConfig = { notes_dir: newDir };
      await setConfig(config);
      set(config);
    },

    /** テスト用に直接セットする（本番コードでは使用しない） */
    _set: set,
  };
}

export const configStore = createConfigStore();
