// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 58-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 58 — Linux バイナリビルド（.AppImage, .deb）
// CoDD trace: plan:implementation_plan > task:58-1

import type { AppMetadata } from './types';

export const APP_METADATA: AppMetadata = {
  name: 'promptnotes',
  productName: 'PromptNotes',
  version: '1.0.0',
  description:
    'A local-first note app for quickly jotting down prompts to pass to AI. No title needed — just write and copy.',
  identifier: 'com.promptnotes.app',
  license: 'MIT',
  homepage: 'https://github.com/promptnotes/promptnotes',
  repository: 'https://github.com/promptnotes/promptnotes',
  categories: ['Utility', 'TextEditor', 'Office'],
  keywords: ['notes', 'prompt', 'markdown', 'local-first', 'editor'],
  mimeTypes: ['text/markdown', 'text/x-markdown', 'text/plain'],
} as const;

export function getAppIdentifier(): string {
  return APP_METADATA.identifier;
}

export function getAppVersion(): string {
  return APP_METADATA.version;
}

export function getBinaryName(): string {
  return APP_METADATA.name;
}

export function getDisplayName(): string {
  return APP_METADATA.productName;
}
