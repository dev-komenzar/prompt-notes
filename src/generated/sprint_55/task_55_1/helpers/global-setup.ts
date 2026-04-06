// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — グローバルセットアップ
import * as fs from 'fs';
import { resolvePlatformConfig } from './platform';

async function globalSetup(): Promise<void> {
  const config = resolvePlatformConfig();

  // Verify Tauri binary exists
  if (!fs.existsSync(config.tauriBinaryPath)) {
    throw new Error(
      `Tauri binary not found at ${config.tauriBinaryPath}. ` +
        'Run `cargo tauri build --release` before executing E2E tests.',
    );
  }

  // Verify platform is supported (linux or macos only)
  if (config.platform !== 'linux' && config.platform !== 'macos') {
    throw new Error(
      `Platform ${config.platform} is not supported. ` +
        'PromptNotes targets linux and macos only.',
    );
  }

  console.log(`[E2E Setup] Platform: ${config.platform}`);
  console.log(`[E2E Setup] Binary: ${config.tauriBinaryPath}`);
  console.log(`[E2E Setup] Default notes dir: ${config.defaultNotesDir}`);
}

export default globalSetup;
