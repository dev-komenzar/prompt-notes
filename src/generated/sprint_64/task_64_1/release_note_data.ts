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
// Dependency: all design documents, req:promptnotes-requirements, test:acceptance_criteria

import type { ReleaseNote } from './types';
import { SUPPORTED_PLATFORMS } from './platform_matrix';
import { TECH_STACK } from './tech_stack';
import { FEATURES } from './feature_manifest';
import { RELEASE_BLOCKING_CONSTRAINTS, SCOPE_EXCLUSIONS } from './constraints';
import { KNOWN_LIMITATIONS } from './known_limitations';

export const RELEASE_V1_0_0: ReleaseNote = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
    label: 'v1.0.0',
  },
  codename: 'PromptNotes',
  releaseDate: '2026-04-06',
  summary:
    'PromptNotes v1.0.0 is the initial release of a local-first prompt note-taking application. ' +
    'Designed for quickly writing and storing AI prompts, it features a title-free, body-only editor ' +
    'with CodeMirror 6, a Pinterest-style grid view for browsing notes, and automatic saving to local ' +
    '.md files. Built on Tauri (Rust + WebView) with Svelte, targeting Linux and macOS.',
  platforms: SUPPORTED_PLATFORMS,
  techStack: TECH_STACK,
  features: FEATURES,
  constraints: RELEASE_BLOCKING_CONSTRAINTS,
  exclusions: SCOPE_EXCLUSIONS,
  knownLimitations: KNOWN_LIMITATIONS,
  breakingChanges: [],
  upgradeNotes: [
    'This is the initial release. No upgrade path from prior versions.',
  ],
} as const;

export function getVersionString(note: ReleaseNote): string {
  return note.version.label;
}
