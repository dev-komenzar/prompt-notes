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
// trace: plan:implementation_plan > design:system-design — platform:linux, platform:macos

import type { SmokeCheckResult } from './smoke-types';
import type { SupportedPlatform } from '../types';
import { runCheck, assert } from './check-helpers';
import { detectPlatform, getDistributionFormats } from '../platform';

/**
 * Platform-level smoke checks verifying:
 *   - FAIL-40: Linux app launches and operates
 *   - FAIL-41: macOS app launches and operates
 *   - FAIL-42: App is running on Tauri framework
 *   - Distribution format consistency
 */
export async function runPlatformChecks(
  expectedPlatform: SupportedPlatform,
  distributionFormat: string,
): Promise<SmokeCheckResult[]> {
  const results: SmokeCheckResult[] = [];

  // PL-01: Platform detection matches expected platform
  results.push(
    await runCheck(
      'PL-01',
      'platform',
      `Detected platform matches expected: ${expectedPlatform}`,
      async () => {
        const detected = await detectPlatform();
        assert(
          detected === expectedPlatform,
          `Expected platform "${expectedPlatform}", detected "${detected}"`,
        );
      },
    ),
  );

  // PL-02: Tauri runtime is present (FAIL-42)
  results.push(
    await runCheck(
      'PL-02',
      'platform',
      'Tauri runtime is present (window.__TAURI__ or @tauri-apps/api available)',
      async () => {
        // Check for Tauri v2 runtime marker
        const hasTauriGlobal = '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
        if (!hasTauriGlobal) {
          // Try importing the API as a secondary check
          try {
            await import('@tauri-apps/api/core');
          } catch {
            throw new Error('Neither __TAURI__ global nor @tauri-apps/api/core is available');
          }
        }
      },
    ),
  );

  // PL-03: Distribution format is valid for the platform
  results.push(
    await runCheck(
      'PL-03',
      'distribution',
      `Distribution format "${distributionFormat}" is valid for ${expectedPlatform}`,
      async () => {
        const validFormats = getDistributionFormats(expectedPlatform);
        assert(
          validFormats.includes(distributionFormat),
          `"${distributionFormat}" is not a valid format for ${expectedPlatform}. Valid: ${validFormats.join(', ')}`,
        );
      },
    ),
  );

  // PL-04: WebView engine responds (basic DOM check)
  results.push(
    await runCheck(
      'PL-04',
      'platform',
      'WebView engine is operational (DOM manipulation works)',
      async () => {
        const testEl = document.createElement('div');
        testEl.setAttribute('data-smoke-test', 'platform-check');
        testEl.textContent = 'smoke';
        document.body.appendChild(testEl);
        const found = document.querySelector('[data-smoke-test="platform-check"]');
        assert(found !== null, 'Created element should be findable in DOM');
        assert(found!.textContent === 'smoke', 'Element text content should match');
        document.body.removeChild(testEl);
      },
    ),
  );

  // PL-05: No Windows-specific code paths active
  results.push(
    await runCheck(
      'PL-05',
      'platform',
      'No Windows-specific runtime detected (Windows is out of scope)',
      async () => {
        const ua = navigator.userAgent.toLowerCase();
        assert(
          !ua.includes('windows nt'),
          'Windows user-agent detected — Windows is out of scope for this release',
        );
      },
    ),
  );

  return results;
}
