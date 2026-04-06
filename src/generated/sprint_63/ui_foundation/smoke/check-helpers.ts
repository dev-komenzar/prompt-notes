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
// trace: plan:implementation_plan — Sprint 63: 全配布形式でのスモークテスト

import type { SmokeCheckResult, SmokeCategory } from './smoke-types';

/**
 * Executes a single smoke check, capturing timing and error information.
 */
export async function runCheck(
  id: string,
  category: SmokeCategory,
  description: string,
  checkFn: () => Promise<void>,
): Promise<SmokeCheckResult> {
  const start = performance.now();
  try {
    await checkFn();
    return {
      id,
      category,
      description,
      passed: true,
      durationMs: performance.now() - start,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      id,
      category,
      description,
      passed: false,
      error: errorMessage,
      durationMs: performance.now() - start,
    };
  }
}

/**
 * Asserts a condition, throwing if false. Used within check functions.
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Asserts that a value is defined (not null/undefined).
 */
export function assertDefined<T>(
  value: T | null | undefined,
  name: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${name} to be defined, got ${value === null ? 'null' : 'undefined'}`);
  }
}

/**
 * Asserts string matches a pattern.
 */
export function assertMatches(value: string, pattern: RegExp, label: string): void {
  if (!pattern.test(value)) {
    throw new Error(`${label}: "${value}" does not match ${pattern}`);
  }
}
