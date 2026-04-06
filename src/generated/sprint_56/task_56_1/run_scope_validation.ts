// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=all

/**
 * Scope Validation Runner
 *
 * Orchestrates all scope validators and produces a unified compliance report.
 * Can be invoked programmatically or used as the entry point for CI checks.
 */

import type { ScopeComplianceResult } from './scope_manifest';
import { validateEditorDependencies } from './validators/editor_scope_validator';
import { validateGridDependencies } from './validators/grid_scope_validator';
import { validateStorageDependencies } from './validators/storage_scope_validator';
import { validateSettingsScopeFromDOM } from './validators/settings_scope_validator';
import { validateFrameworkDependencies, validateIPCBoundaryPatterns } from './validators/framework_scope_validator';
import { validatePlatformTargets, type TauriConfig } from './validators/platform_scope_validator';
import { validateNoAIDependencies, validateNoAISourcePatterns } from './validators/ai_scope_validator';
import { generateComplianceReport, formatComplianceReport, type ComplianceReport } from './compliance_report';

export interface ValidationInput {
  readonly installedPackages: ReadonlySet<string>;
  readonly sourceFiles?: ReadonlyArray<{ path: string; content: string }>;
  readonly tauriConfig?: TauriConfig;
}

/**
 * Runs all dependency-based (static) scope validations.
 * These do not require a running DOM.
 */
export function runStaticScopeValidation(
  input: ValidationInput,
): ComplianceReport {
  const results: ScopeComplianceResult[] = [];

  // Framework validation
  results.push(validateFrameworkDependencies(input.installedPackages));

  // Editor dependency validation
  results.push(validateEditorDependencies(input.installedPackages));

  // Grid dependency validation
  results.push(validateGridDependencies(input.installedPackages));

  // Storage dependency validation
  results.push(validateStorageDependencies(input.installedPackages));

  // AI dependency validation
  results.push(validateNoAIDependencies(input.installedPackages));

  // Platform target validation
  if (input.tauriConfig) {
    results.push(validatePlatformTargets(input.tauriConfig));
  }

  // Source code pattern validation
  if (input.sourceFiles) {
    for (const file of input.sourceFiles) {
      const ipcResult = validateIPCBoundaryPatterns(file.content, file.path);
      if (!ipcResult.passed) {
        results.push(ipcResult);
      }

      const aiResult = validateNoAISourcePatterns(file.content, file.path);
      if (!aiResult.passed) {
        results.push(aiResult);
      }
    }
  }

  return generateComplianceReport(results);
}

/**
 * Convenience: Builds a package set from a package.json dependencies object.
 */
export function buildPackageSet(
  packageJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
): Set<string> {
  const packages = new Set<string>();

  if (packageJson.dependencies) {
    for (const name of Object.keys(packageJson.dependencies)) {
      packages.add(name);
    }
  }

  if (packageJson.devDependencies) {
    for (const name of Object.keys(packageJson.devDependencies)) {
      packages.add(name);
    }
  }

  return packages;
}

/**
 * Prints the compliance report to console and returns the exit code.
 * 0 = all passed, 1 = violations found.
 */
export function printAndExit(report: ComplianceReport): number {
  const formatted = formatComplianceReport(report);
  if (report.overallPassed) {
    console.log(formatted);
    return 0;
  } else {
    console.error(formatted);
    return 1;
  }
}
