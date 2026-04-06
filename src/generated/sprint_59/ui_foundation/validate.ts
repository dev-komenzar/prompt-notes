// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 59-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 59 — Task 59-1 (Linux Flatpak パッケージ作成)
// CoDD trace: plan:implementation_plan > test:acceptance_criteria
// Module: ui_foundation | Platform: linux

import type {
  FlatpakManifest,
  FlatpakValidationResult,
  DesktopEntry,
  AppStreamMetadata,
} from './types';
import { FLATPAK_APP_ID, APP_BINARY_NAME } from './types';
import { validateFinishArgs } from './flatpak-permissions';
import { validateDesktopEntry } from './desktop-entry';
import { validateAppStreamMetadata } from './appstream-metadata';

/**
 * Comprehensive validation of all Flatpak submission artifacts.
 * Checks manifest, desktop entry, and AppStream metadata against
 * Flathub submission requirements.
 */
export function validateFlatpakSubmission(
  manifest: FlatpakManifest,
  desktopEntry: DesktopEntry,
  appstreamMetadata: AppStreamMetadata
): FlatpakValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const manifestResult = validateFlatpakManifest(manifest);
  errors.push(...manifestResult.errors);
  warnings.push(...manifestResult.warnings);

  const desktopResult = validateDesktopEntry(desktopEntry);
  errors.push(...desktopResult.errors.map((e) => `[desktop] ${e}`));

  const appstreamResult = validateAppStreamMetadata(appstreamMetadata);
  errors.push(...appstreamResult.errors.map((e) => `[appstream] ${e}`));
  warnings.push(...appstreamResult.warnings.map((w) => `[appstream] ${w}`));

  const crossRefResult = validateCrossReferences(manifest, desktopEntry, appstreamMetadata);
  errors.push(...crossRefResult.errors);
  warnings.push(...crossRefResult.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate the Flatpak manifest structure and required fields.
 */
export function validateFlatpakManifest(manifest: FlatpakManifest): {
  valid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (manifest['app-id'] !== FLATPAK_APP_ID) {
    errors.push(`App ID must be "${FLATPAK_APP_ID}", got "${manifest['app-id']}"`);
  }

  if (!manifest.runtime || manifest.runtime.trim().length === 0) {
    errors.push('Runtime is required');
  }

  if (!manifest['runtime-version'] || manifest['runtime-version'].trim().length === 0) {
    errors.push('Runtime version is required');
  }

  if (!manifest.sdk || manifest.sdk.trim().length === 0) {
    errors.push('SDK is required');
  }

  if (manifest.command !== APP_BINARY_NAME) {
    errors.push(`Command must be "${APP_BINARY_NAME}", got "${manifest.command}"`);
  }

  if (!manifest['finish-args'] || manifest['finish-args'].length === 0) {
    errors.push('finish-args is required');
  } else {
    const permResult = validateFinishArgs(manifest['finish-args']);
    if (!permResult.valid) {
      for (const missing of permResult.missing) {
        errors.push(`Missing required permission: ${missing}`);
      }
    }
  }

  if (!manifest.modules || manifest.modules.length === 0) {
    errors.push('At least one module is required');
  }

  const hasAppModule = manifest.modules.some((m) => m.name === APP_BINARY_NAME);
  if (!hasAppModule) {
    errors.push(`Manifest must include a module named "${APP_BINARY_NAME}"`);
  }

  const sdkExtensions = manifest['sdk-extensions'] ?? [];
  const hasRustSdk = sdkExtensions.some((ext) => ext.includes('rust'));
  const hasNodeSdk = sdkExtensions.some((ext) => ext.includes('node'));

  if (!hasRustSdk) {
    errors.push('Rust SDK extension is required for Tauri build');
  }

  if (!hasNodeSdk) {
    warnings.push('Node.js SDK extension is recommended for frontend build');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate cross-references between manifest, desktop entry, and AppStream metadata.
 * Ensures consistency across all submission artifacts.
 */
function validateCrossReferences(
  manifest: FlatpakManifest,
  desktopEntry: DesktopEntry,
  appstreamMetadata: AppStreamMetadata
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (appstreamMetadata.id !== manifest['app-id']) {
    errors.push(
      `AppStream ID "${appstreamMetadata.id}" must match manifest app-id "${manifest['app-id']}"`
    );
  }

  if (desktopEntry['X-Flatpak'] && desktopEntry['X-Flatpak'] !== manifest['app-id']) {
    errors.push(
      `Desktop entry X-Flatpak "${desktopEntry['X-Flatpak']}" must match manifest app-id "${manifest['app-id']}"`
    );
  }

  const expectedDesktopId = `${manifest['app-id']}.desktop`;
  if (appstreamMetadata.launchable !== expectedDesktopId) {
    errors.push(
      `AppStream launchable "${appstreamMetadata.launchable}" must be "${expectedDesktopId}"`
    );
  }

  if (desktopEntry.Icon !== manifest['app-id']) {
    warnings.push(
      `Desktop entry Icon "${desktopEntry.Icon}" should match manifest app-id "${manifest['app-id']}"`
    );
  }

  if (desktopEntry.Exec !== manifest.command) {
    warnings.push(
      `Desktop entry Exec "${desktopEntry.Exec}" should match manifest command "${manifest.command}"`
    );
  }

  return { errors, warnings };
}

/**
 * Validate that the Flatpak app-id follows Flathub naming conventions.
 * Flathub requires reverse-DNS with at least 3 components.
 */
export function validateAppId(appId: string): {
  valid: boolean;
  errors: readonly string[];
} {
  const errors: string[] = [];

  const pattern = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*){2,}$/;
  if (!pattern.test(appId)) {
    errors.push('App ID must be in reverse-DNS format with at least 3 components (e.g., org.example.App)');
  }

  if (appId.length > 255) {
    errors.push('App ID must not exceed 255 characters');
  }

  const components = appId.split('.');
  for (const component of components) {
    if (component.startsWith('_') || component.endsWith('_')) {
      errors.push(`App ID component "${component}" must not start or end with underscore`);
    }
  }

  return { valid: errors.length === 0, errors };
}
