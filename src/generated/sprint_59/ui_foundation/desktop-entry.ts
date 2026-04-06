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
// CoDD trace: plan:implementation_plan > design:system-design
// Module: ui_foundation | Platform: linux

import type { DesktopEntry } from './types';
import {
  FLATPAK_APP_ID,
  APP_NAME,
  APP_SUMMARY,
  APP_BINARY_NAME,
} from './types';

/**
 * Generate the .desktop entry for PromptNotes.
 *
 * Follows the freedesktop.org Desktop Entry Specification:
 * https://specifications.freedesktop.org/desktop-entry-spec/latest/
 *
 * The desktop entry is installed to /app/share/applications/ in the Flatpak.
 * The filename must match the app-id: io.github.promptnotes.PromptNotes.desktop
 */
export function generateDesktopEntry(): DesktopEntry {
  return {
    Type: 'Application',
    Name: APP_NAME,
    GenericName: 'Note Editor',
    Comment: APP_SUMMARY,
    Exec: APP_BINARY_NAME,
    Icon: FLATPAK_APP_ID,
    Terminal: false,
    Categories: 'Utility;TextEditor;',
    Keywords: 'notes;prompt;markdown;editor;ai;',
    MimeType: 'text/markdown;text/plain;',
    StartupWMClass: APP_BINARY_NAME,
    StartupNotify: true,
    'X-Flatpak': FLATPAK_APP_ID,
  };
}

/**
 * Serialize a DesktopEntry to the .desktop file format (INI-like).
 */
export function serializeDesktopEntry(entry: DesktopEntry): string {
  const lines: string[] = ['[Desktop Entry]'];

  const fieldOrder: (keyof DesktopEntry)[] = [
    'Type',
    'Name',
    'GenericName',
    'Comment',
    'Exec',
    'Icon',
    'Terminal',
    'Categories',
    'Keywords',
    'MimeType',
    'StartupWMClass',
    'StartupNotify',
    'X-Flatpak',
  ];

  for (const key of fieldOrder) {
    const value = entry[key];
    if (value === undefined) continue;

    if (typeof value === 'boolean') {
      lines.push(`${key}=${value ? 'true' : 'false'}`);
    } else {
      lines.push(`${key}=${value}`);
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Validate the desktop entry against Flathub submission requirements.
 */
export function validateDesktopEntry(entry: DesktopEntry): {
  valid: boolean;
  errors: readonly string[];
} {
  const errors: string[] = [];

  if (entry.Type !== 'Application') {
    errors.push('Type must be "Application"');
  }

  if (!entry.Name || entry.Name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!entry.Exec || entry.Exec.trim().length === 0) {
    errors.push('Exec is required');
  }

  if (!entry.Icon || entry.Icon.trim().length === 0) {
    errors.push('Icon is required');
  }

  if (!entry.Categories || entry.Categories.trim().length === 0) {
    errors.push('Categories is required for Flathub submission');
  }

  if (entry.Terminal !== false) {
    errors.push('Terminal should be false for GUI applications');
  }

  const appIdPattern = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*){2,}$/;
  if (entry.Icon && !appIdPattern.test(entry.Icon)) {
    errors.push('Icon should use reverse-DNS app-id format for Flatpak');
  }

  return { valid: errors.length === 0, errors };
}
