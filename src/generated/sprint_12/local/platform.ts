// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-2
// @task-title: .local
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// sprint: 12, task: 12-2 (.local)
// Traceability: detail:storage_fileformat §4.3, convention NNC-S4

/**
 * Platform detection utilities for notes directory resolution.
 * Rust backend uses #[cfg(target_os)] — this TypeScript layer mirrors
 * the same logic for IPC parameter construction.
 */

import type { SupportedPlatform } from '@/generated/sprint_12/ui_foundation';
import { DEFAULT_NOTES_DIR_LINUX, DEFAULT_NOTES_DIR_MACOS } from '@/generated/sprint_12/ui_foundation';

export function detectPlatform(): SupportedPlatform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'macos';
  return 'linux';
}

export function defaultNotesDirForPlatform(platform: SupportedPlatform): string {
  switch (platform) {
    case 'linux':
      return DEFAULT_NOTES_DIR_LINUX;
    case 'macos':
      return DEFAULT_NOTES_DIR_MACOS;
  }
}
