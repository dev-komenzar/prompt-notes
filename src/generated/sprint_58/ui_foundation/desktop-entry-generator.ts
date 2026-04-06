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

import type { DesktopEntryConfig, DesktopAction } from './types';
import { APP_METADATA } from './app-metadata';

export function createDefaultDesktopEntryConfig(): DesktopEntryConfig {
  return {
    name: APP_METADATA.productName,
    genericName: 'Note Editor',
    comment: APP_METADATA.description,
    exec: `${APP_METADATA.name} %U`,
    icon: APP_METADATA.name,
    type: 'Application',
    categories: ['Utility', 'TextEditor', 'Office'],
    mimeType: ['text/markdown', 'text/x-markdown', 'text/plain'],
    startupNotify: true,
    startupWmClass: APP_METADATA.productName,
    terminal: false,
    actions: [
      {
        name: 'New Note',
        exec: `${APP_METADATA.name} --new-note`,
      },
    ],
  };
}

export function generateDesktopEntry(config: DesktopEntryConfig): string {
  const lines: string[] = ['[Desktop Entry]'];

  lines.push(`Name=${config.name}`);
  lines.push(`GenericName=${config.genericName}`);
  lines.push(`Comment=${config.comment}`);
  lines.push(`Exec=${config.exec}`);
  lines.push(`Icon=${config.icon}`);
  lines.push(`Type=${config.type}`);
  lines.push(`Terminal=${config.terminal ? 'true' : 'false'}`);
  lines.push(`StartupNotify=${config.startupNotify ? 'true' : 'false'}`);
  lines.push(`StartupWMClass=${config.startupWmClass}`);

  if (config.categories.length > 0) {
    lines.push(`Categories=${config.categories.join(';')};`);
  }

  if (config.mimeType.length > 0) {
    lines.push(`MimeType=${config.mimeType.join(';')};`);
  }

  if (config.actions.length > 0) {
    lines.push(`Actions=${config.actions.map((_, i) => `action${i}`).join(';')};`);
    lines.push('');

    config.actions.forEach((action: DesktopAction, index: number) => {
      lines.push(`[Desktop Action action${index}]`);
      lines.push(`Name=${action.name}`);
      lines.push(`Exec=${action.exec}`);
      if (action.icon) {
        lines.push(`Icon=${action.icon}`);
      }
      lines.push('');
    });
  }

  return lines.join('\n') + '\n';
}

export function validateDesktopEntry(content: string): DesktopEntryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.startsWith('[Desktop Entry]')) {
    errors.push('Desktop entry must start with [Desktop Entry] group header.');
  }

  const requiredKeys = ['Name', 'Exec', 'Type', 'Icon'];
  for (const key of requiredKeys) {
    const pattern = new RegExp(`^${key}=.+`, 'm');
    if (!pattern.test(content)) {
      errors.push(`Required key "${key}" is missing.`);
    }
  }

  const typeMatch = content.match(/^Type=(.+)$/m);
  if (typeMatch && typeMatch[1] !== 'Application') {
    errors.push(`Type must be "Application", found "${typeMatch[1]}".`);
  }

  const terminalMatch = content.match(/^Terminal=(.+)$/m);
  if (terminalMatch && terminalMatch[1] === 'true') {
    warnings.push('Terminal=true is set. PromptNotes is a GUI application and should have Terminal=false.');
  }

  if (!content.match(/^Categories=.+/m)) {
    warnings.push('Categories key is missing. Recommended for proper desktop integration.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export interface DesktopEntryValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}
