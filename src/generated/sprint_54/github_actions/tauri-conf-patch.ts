// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: GitHub Actions で自動生成
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md §4.1, §4.10
// @generated-by: codd implement --sprint 54

/**
 * Validates and documents the required tauri.conf.json fields for macOS DMG builds
 * and GitHub Actions notarization integration.
 *
 * Tauri reads signing configuration from environment variables set by the workflow.
 * This module documents the expected configuration and validates the existing conf.
 */

import * as fs from 'fs';
import * as path from 'path';

interface TauriBundle {
  identifier: string;
  icon: string[];
  macOS?: {
    minimumSystemVersion?: string;
    signingIdentity?: string | null;
    notarizeMode?: string;
  };
}

interface TauriConf {
  productName: string;
  version: string;
  bundle: TauriBundle;
}

/**
 * Minimum required tauri.conf.json bundle configuration for macOS DMG builds
 * with GitHub Actions notarization.
 *
 * The signingIdentity is intentionally null here; it is injected via the
 * APPLE_SIGNING_IDENTITY environment variable during the GitHub Actions release
 * workflow so that local development builds are never code-signed.
 */
export const REQUIRED_MACOS_BUNDLE_FIELDS = {
  identifier: 'com.promptnotes.app',
  macOS: {
    minimumSystemVersion: '10.15',
    // null = read from APPLE_SIGNING_IDENTITY env var at build time
    signingIdentity: null as null,
  },
} as const;

/**
 * Environment variables consumed by Tauri during the macOS notarization step.
 * All must be present as GitHub Actions secrets when building a release.
 */
export const REQUIRED_NOTARIZATION_ENV_VARS = [
  'APPLE_CERTIFICATE',
  'APPLE_CERTIFICATE_PASSWORD',
  'APPLE_SIGNING_IDENTITY',
  'APPLE_ID',
  'APPLE_PASSWORD',
  'APPLE_TEAM_ID',
] as const;

export type NotarizationEnvVar = (typeof REQUIRED_NOTARIZATION_ENV_VARS)[number];

/**
 * Verifies that all required notarization environment variables are present.
 * Call this in a pre-build check step for local validation.
 */
export function checkNotarizationEnv(): { ok: boolean; missing: NotarizationEnvVar[] } {
  const missing = REQUIRED_NOTARIZATION_ENV_VARS.filter(
    (v) => !process.env[v],
  ) as NotarizationEnvVar[];
  return { ok: missing.length === 0, missing };
}

/**
 * Reads and validates src-tauri/tauri.conf.json, printing warnings for any
 * fields required by the release workflow that are absent or misconfigured.
 */
export function validateTauriConf(projectRoot: string = process.cwd()): boolean {
  const confPath = path.join(projectRoot, 'src-tauri', 'tauri.conf.json');

  if (!fs.existsSync(confPath)) {
    console.error(`ERROR: ${confPath} not found.`);
    return false;
  }

  let conf: TauriConf;
  try {
    conf = JSON.parse(fs.readFileSync(confPath, 'utf-8')) as TauriConf;
  } catch {
    console.error(`ERROR: Failed to parse ${confPath}.`);
    return false;
  }

  let valid = true;

  if (!conf.bundle?.identifier) {
    console.warn('WARN: bundle.identifier is missing in tauri.conf.json');
    valid = false;
  }

  if (!Array.isArray(conf.bundle?.icon) || conf.bundle.icon.length === 0) {
    console.warn('WARN: bundle.icon array is empty or missing in tauri.conf.json');
    valid = false;
  }

  if (conf.bundle?.macOS?.signingIdentity !== undefined &&
      conf.bundle.macOS.signingIdentity !== null) {
    console.warn(
      'WARN: bundle.macOS.signingIdentity should be null in tauri.conf.json. ' +
      'The signing identity is injected via the APPLE_SIGNING_IDENTITY env var in CI.'
    );
  }

  if (valid) {
    console.log(`OK: ${confPath} is correctly configured for GitHub Actions DMG builds.`);
  }

  return valid;
}

if (require.main === module) {
  const envCheck = checkNotarizationEnv();
  if (!envCheck.ok) {
    console.warn(
      `Missing notarization env vars (expected in CI secrets): ${envCheck.missing.join(', ')}`
    );
  }
  const confOk = validateTauriConf();
  process.exit(confOk ? 0 : 1);
}
