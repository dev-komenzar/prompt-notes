// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 64-1
// @task-title: —
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=64, task=64-1, module=release_notes
// Dependency: governance:adr_tech_stack (ADR-001..ADR-006)

import type { TechStackEntry } from './types';

export const TECH_STACK: readonly TechStackEntry[] = [
  {
    component: 'Application Framework',
    technology: 'Tauri (Rust + WebView)',
    version: 'v2',
    adrId: 'ADR-001',
    locked: true,
  },
  {
    component: 'Frontend UI Framework',
    technology: 'Svelte',
    version: '4.x',
    adrId: 'ADR-002',
    locked: true,
  },
  {
    component: 'Editor Engine',
    technology: 'CodeMirror 6',
    version: '6.x',
    adrId: 'ADR-003',
    locked: true,
  },
  {
    component: 'Data Storage',
    technology: 'Local .md files',
    version: 'N/A',
    adrId: 'ADR-004',
    locked: true,
  },
  {
    component: 'Search',
    technology: 'File full-scan (std::fs + str::contains)',
    version: 'N/A',
    adrId: 'ADR-005',
    locked: true,
  },
  {
    component: 'Backend File I/O',
    technology: 'Rust std::fs',
    version: 'stable',
    adrId: 'ADR-004',
    locked: true,
  },
  {
    component: 'Timestamp Generation',
    technology: 'chrono crate',
    version: 'latest stable',
    adrId: 'ADR-004',
    locked: true,
  },
  {
    component: 'Frontmatter Parsing',
    technology: 'serde_yaml crate',
    version: 'latest stable',
    adrId: 'ADR-004',
    locked: true,
  },
  {
    component: 'Config Serialization',
    technology: 'serde_json crate',
    version: 'latest stable',
    adrId: 'ADR-004',
    locked: true,
  },
  {
    component: 'Default Directory Resolution',
    technology: 'dirs crate',
    version: 'latest stable',
    adrId: 'ADR-004',
    locked: true,
  },
] as const;

export function formatTechStackTable(stack: readonly TechStackEntry[]): string {
  const lines: string[] = [];
  lines.push('| Component | Technology | Version | ADR | Locked |');
  lines.push('|-----------|-----------|---------|-----|--------|');
  for (const entry of stack) {
    const lockIcon = entry.locked ? '🔒' : '—';
    lines.push(
      `| ${entry.component} | ${entry.technology} | ${entry.version} | ${entry.adrId} | ${lockIcon} |`
    );
  }
  return lines.join('\n');
}
