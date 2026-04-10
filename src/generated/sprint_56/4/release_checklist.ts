// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 4 モジュール実装完了
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 56 Task 56-1: リリースチェックリスト最終評価

import { ALL_MODULE_CHECKLISTS, evaluateChecklists, type ChecklistSummary } from './module_completion_checklist';
import { E2E_TEST_SPECS, validateE2ECoverage, type QualityGateResult } from './e2e_test_coverage';
import {
  evaluatePlatformReadiness,
  type PlatformReleaseReadiness,
  type DistributionFormat,
} from './platform_packaging_check';

export interface ReleaseChecklistInput {
  /** tests/e2e/ 配下に存在するテストファイルパス一覧 */
  existingTestFiles: string[];
  /** Linux 向けに生成済みの配布形式 */
  linuxFormats: DistributionFormat[];
  /** macOS 向けに生成済みの配布形式 */
  macosFormats: DistributionFormat[];
}

export interface ReleaseChecklistResult {
  moduleChecklist: ChecklistSummary;
  e2eCoverage: QualityGateResult;
  platformReadiness: PlatformReleaseReadiness;
  /** true のとき全条件を満たしリリース可能 */
  releaseApproved: boolean;
  blockers: string[];
}

export function runReleaseChecklist(input: ReleaseChecklistInput): ReleaseChecklistResult {
  const moduleChecklist = evaluateChecklists(ALL_MODULE_CHECKLISTS);
  const e2eCoverage = validateE2ECoverage(input.existingTestFiles);
  const platformReadiness = evaluatePlatformReadiness(input.linuxFormats, input.macosFormats);

  const blockers: string[] = [];

  if (!moduleChecklist.releaseReady) {
    blockers.push(
      `モジュール要件未達: ${moduleChecklist.releaseBlockingFailed.join(', ')}`,
    );
  }

  if (!e2eCoverage.passed) {
    blockers.push(`E2E テストファイル未生成: ${e2eCoverage.missingSpecs.join(', ')}`);
  }

  if (!platformReadiness.linux.allPresent) {
    const missing = platformReadiness.linux.artifacts
      .filter((a) => a.required)
      .map((a) => a.format);
    blockers.push(`Linux パッケージング未完了: ${missing.join(', ')}`);
  }

  if (!platformReadiness.macos.allPresent) {
    const missing = platformReadiness.macos.artifacts
      .filter((a) => a.required)
      .map((a) => a.format);
    blockers.push(`macOS パッケージング未完了: ${missing.join(', ')}`);
  }

  return {
    moduleChecklist,
    e2eCoverage,
    platformReadiness,
    releaseApproved: blockers.length === 0,
    blockers,
  };
}

/**
 * CI パイプライン用: 終了コードを返す。
 * 0 = リリース承認、1 = ブロッカーあり
 */
export function ciExitCode(result: ReleaseChecklistResult): 0 | 1 {
  return result.releaseApproved ? 0 : 1;
}

/** デフォルトの期待入力（全成果物が揃っている状態） */
export const EXPECTED_RELEASE_INPUT: ReleaseChecklistInput = {
  existingTestFiles: E2E_TEST_SPECS.map((s) => s.file),
  linuxFormats: ['binary-deb', 'binary-appimage', 'flatpak', 'nixos'],
  macosFormats: ['binary-dmg', 'homebrew-cask'],
};
