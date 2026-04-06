// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 57-1
// @task-title: 対象プラットフォーム
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=57, task=57-1, deliverable=対象プラットフォーム
// Conventions: module:editor — Cmd+N / Ctrl+N で即座に新規ノート作成しフォーカス移動必須。

import { Platform } from './platform';

/**
 * Modifier key name per platform.
 * macOS uses "Cmd" (⌘), Linux uses "Ctrl".
 */
export const MODIFIER_KEY: Readonly<Record<Platform, string>> = {
  [Platform.MacOS]: 'Cmd',
  [Platform.Linux]: 'Ctrl',
} as const;

/**
 * Modifier key symbol for UI display.
 */
export const MODIFIER_SYMBOL: Readonly<Record<Platform, string>> = {
  [Platform.MacOS]: '⌘',
  [Platform.Linux]: 'Ctrl',
} as const;

/**
 * CodeMirror 6 uses "Mod" as a cross-platform modifier alias.
 * "Mod" maps to Cmd on macOS and Ctrl on Linux automatically.
 * This constant is used when registering CodeMirror keymaps.
 */
export const CM6_MOD_KEY = 'Mod' as const;

/**
 * Core application keybindings.
 * These are release-blocking: Cmd+N / Ctrl+N for new note is mandatory.
 */
export interface KeybindingDef {
  /** CodeMirror 6 key string (platform-agnostic, uses "Mod"). */
  readonly cm6Key: string;
  /** Human-readable label for the current platform. */
  readonly label: string;
  /** Description of the action. */
  readonly description: string;
}

/**
 * Returns the platform-specific display label for a keybinding
 * that uses the platform modifier key.
 */
export function formatKeybindingLabel(
  platform: Platform,
  key: string
): string {
  return `${MODIFIER_SYMBOL[platform]}+${key}`;
}

/**
 * Core keybindings that must be registered in the application.
 * Missing any of these is a release-blocking failure.
 */
export function getCoreKeybindings(platform: Platform): readonly KeybindingDef[] {
  return [
    {
      cm6Key: 'Mod-n',
      label: formatKeybindingLabel(platform, 'N'),
      description: '新規ノート作成',
    },
  ] as const;
}

/**
 * Returns the new-note keybinding definition for the given platform.
 * This is the most critical keybinding in the application (RBC-1).
 */
export function getNewNoteKeybinding(platform: Platform): KeybindingDef {
  return {
    cm6Key: 'Mod-n',
    label: formatKeybindingLabel(platform, 'N'),
    description: '新規ノート作成',
  };
}
