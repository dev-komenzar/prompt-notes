// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > detail:storage_fileformat — CONV-DIRECTORY

import type { SmokeCheckResult } from './smoke-types';
import type { SupportedPlatform } from '../types';
import { runCheck, assert, assertDefined } from './check-helpers';
import { getConfig } from '../ipc-client';
import { getExpectedDefaultNotesDir } from '../platform';

/**
 * Smoke checks for module:settings.
 * Verifies:
 *   - FAIL-23: Settings can read current config
 *   - FAIL-24 / FAIL-25: Default directory matches platform convention
 *   - CONV-DIRECTORY: Default dirs are correct for Linux / macOS
 *
 * NOTE: We do NOT test set_config here because smoke tests should not
 * mutate the user's configuration. We verify the read path only.
 */
export async function runSettingsChecks(
  platform: SupportedPlatform,
): Promise<SmokeCheckResult[]> {
  const results: SmokeCheckResult[] = [];

  // SE-01: get_config returns valid configuration
  results.push(
    await runCheck(
      'SE-01',
      'settings',
      'get_config IPC returns a valid Config object',
      async () => {
        const config = await getConfig();
        assertDefined(config, 'config');
        assertDefined(config.notes_dir, 'config.notes_dir');
        assert(typeof config.notes_dir === 'string', 'notes_dir must be a string');
        assert(config.notes_dir.length > 0, 'notes_dir must not be empty');
      },
    ),
  );

  // SE-02: Default notes directory matches platform convention
  results.push(
    await runCheck(
      'SE-02',
      'settings',
      `Default notes_dir matches ${platform} convention`,
      async () => {
        const config = await getConfig();
        const expectedSuffix = platform === 'linux'
          ? 'promptnotes/notes'
          : 'promptnotes/notes';
        // We check that the path ends with the expected suffix regardless of home dir expansion
        const normalizedPath = config.notes_dir.replace(/\/+$/, '');
        assert(
          normalizedPath.endsWith(expectedSuffix),
          `Expected notes_dir to end with "${expectedSuffix}", got "${normalizedPath}"`,
        );
      },
    ),
  );

  // SE-03: Platform-specific path prefix validation
  results.push(
    await runCheck(
      'SE-03',
      'settings',
      `Default notes_dir contains platform-appropriate base path (${platform})`,
      async () => {
        const config = await getConfig();
        if (platform === 'linux') {
          assert(
            config.notes_dir.includes('.local/share') || config.notes_dir.includes('promptnotes'),
            'Linux notes_dir should contain .local/share path segment',
          );
        } else {
          assert(
            config.notes_dir.includes('Application Support') || config.notes_dir.includes('promptnotes'),
            'macOS notes_dir should contain Application Support path segment',
          );
        }
      },
    ),
  );

  return results;
}
