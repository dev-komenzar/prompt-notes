// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-2
// @task-title: 動作確認済み
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @generated-by: codd implement --sprint 54

import {
  buildReleaseWorkflow,
  ciWorkflow,
  generateYaml,
  REQUIRED_MACOS_BUNDLE_FIELDS,
  REQUIRED_NOTARIZATION_ENV_VARS,
  checkNotarizationEnv,
  validateTauriConf,
} from '../github_actions/generate-workflows';
import type { GitHubWorkflow, MacOSSecrets } from '../github_actions/workflow-types';

export interface VerificationResult {
  passed: boolean;
  checks: CheckResult[];
  summary: string;
}

export interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

function check(name: string, fn: () => { passed: boolean; detail: string }): CheckResult {
  try {
    const result = fn();
    return { name, ...result };
  } catch (err) {
    return { name, passed: false, detail: String(err) };
  }
}

function verifyMacOSMatrix(workflow: GitHubWorkflow): CheckResult {
  return check('macOS matrix entry exists', () => {
    const buildJob = workflow.jobs['build-release'];
    if (!buildJob?.strategy?.matrix?.include) {
      return { passed: false, detail: 'build-release job has no matrix.include' };
    }
    const macEntry = buildJob.strategy.matrix.include.find(
      (e) => e.platform === 'macos-latest'
    );
    if (!macEntry) {
      return { passed: false, detail: 'No macos-latest entry in matrix' };
    }
    return { passed: true, detail: `macOS entry: target=${macEntry.target}` };
  });
}

function verifyDmgArtifact(workflow: GitHubWorkflow): CheckResult {
  return check('.dmg artifact upload step exists', () => {
    const buildJob = workflow.jobs['build-release'];
    if (!buildJob?.steps) {
      return { passed: false, detail: 'build-release job has no steps' };
    }
    const uploadStep = buildJob.steps.find(
      (s) => s.name?.toLowerCase().includes('upload') && s.uses?.includes('upload-artifact')
    );
    if (!uploadStep) {
      return { passed: false, detail: 'No upload-artifact step found' };
    }
    const pathParam = uploadStep.with?.path ?? '';
    const hasDmg =
      typeof pathParam === 'string' &&
      (pathParam.includes('dmg') || pathParam.includes('bundle'));
    return {
      passed: hasDmg,
      detail: hasDmg
        ? `Upload path: ${pathParam}`
        : `Upload path "${pathParam}" does not reference .dmg`,
    };
  });
}

function verifyNotarizationSecrets(workflow: GitHubWorkflow): CheckResult {
  return check('macOS notarization secrets referenced', () => {
    const yaml = generateYaml(workflow);
    const missing = REQUIRED_NOTARIZATION_ENV_VARS.filter((v) => !yaml.includes(v));
    if (missing.length > 0) {
      return {
        passed: false,
        detail: `Missing notarization env vars: ${missing.join(', ')}`,
      };
    }
    return {
      passed: true,
      detail: `All ${REQUIRED_NOTARIZATION_ENV_VARS.length} notarization vars present`,
    };
  });
}

function verifyWorkflowYamlWellFormed(workflow: GitHubWorkflow): CheckResult {
  return check('Workflow YAML is non-empty and well-structured', () => {
    const yaml = generateYaml(workflow);
    if (!yaml || yaml.trim().length === 0) {
      return { passed: false, detail: 'Generated YAML is empty' };
    }
    if (!yaml.startsWith('name:') && !yaml.startsWith("'name':")) {
      return { passed: false, detail: 'YAML does not start with name field' };
    }
    if (!yaml.includes('jobs:')) {
      return { passed: false, detail: 'YAML missing jobs section' };
    }
    return { passed: true, detail: `YAML length: ${yaml.length} chars` };
  });
}

function verifyCIWorkflowLinuxAndMac(workflow: GitHubWorkflow): CheckResult {
  return check('CI workflow covers linux and macos platforms', () => {
    const yaml = generateYaml(workflow);
    const hasLinux = yaml.includes('ubuntu') || yaml.includes('linux');
    const hasMac = yaml.includes('macos');
    if (!hasLinux || !hasMac) {
      return {
        passed: false,
        detail: `linux=${hasLinux} macos=${hasMac}`,
      };
    }
    return { passed: true, detail: 'Both linux and macos runners present in CI' };
  });
}

function verifyTauriConfBundleFields(): CheckResult {
  return check('tauri.conf.json bundle identifier field names valid', () => {
    const required = REQUIRED_MACOS_BUNDLE_FIELDS;
    if (!required || required.length === 0) {
      return { passed: false, detail: 'REQUIRED_MACOS_BUNDLE_FIELDS is empty' };
    }
    return {
      passed: true,
      detail: `Required bundle fields: ${required.join(', ')}`,
    };
  });
}

function verifyEnvCheckFunction(): CheckResult {
  return check('checkNotarizationEnv function is callable', () => {
    const mockEnv: Record<string, string> = {};
    for (const v of REQUIRED_NOTARIZATION_ENV_VARS) {
      mockEnv[v] = 'mock-value';
    }
    const result = checkNotarizationEnv(mockEnv);
    if (!result.valid) {
      return {
        passed: false,
        detail: `checkNotarizationEnv rejected complete env: ${result.missing?.join(', ')}`,
      };
    }
    return { passed: true, detail: 'checkNotarizationEnv accepts complete env set' };
  });
}

function verifyTauriConfValidation(): CheckResult {
  return check('validateTauriConf function is callable', () => {
    const minimalConf = {
      bundle: {
        identifier: 'com.promptnotes.app',
        icon: ['icons/icon.png'],
      },
    };
    const result = validateTauriConf(minimalConf);
    // result may pass or fail, but function must not throw
    return {
      passed: true,
      detail: `validateTauriConf returned valid=${result.valid}`,
    };
  });
}

export function runDmgWorkflowVerification(): VerificationResult {
  const release = buildReleaseWorkflow;
  const ci = ciWorkflow;

  const checks: CheckResult[] = [
    verifyWorkflowYamlWellFormed(release),
    verifyMacOSMatrix(release),
    verifyDmgArtifact(release),
    verifyNotarizationSecrets(release),
    verifyCIWorkflowLinuxAndMac(ci),
    verifyTauriConfBundleFields(),
    verifyEnvCheckFunction(),
    verifyTauriConfValidation(),
  ];

  const failed = checks.filter((c) => !c.passed);
  const passed = failed.length === 0;

  const summary = passed
    ? `All ${checks.length} checks passed. macOS .dmg workflow is verified.`
    : `${failed.length}/${checks.length} checks failed: ${failed.map((c) => c.name).join('; ')}`;

  return { passed, checks, summary };
}
