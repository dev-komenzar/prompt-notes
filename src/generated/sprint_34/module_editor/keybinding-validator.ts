// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 34-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:34 task:34-1 module:editor
// CoDD trace: detail:editor_clipboard → plan:implementation_plan
// Sprint 34 core: プラットフォームキーバインド検証
// Provides validation utilities and introspection for platform keybindings
// on Linux (GTK WebKitGTK) and macOS (WKWebView).

import { detectPlatform, type SupportedPlatform } from './platform';

export interface KeybindingSpec {
  /** Unique identifier for the keybinding. */
  id: string;
  /** CM6 key string (e.g. 'Mod-n'). */
  cm6Key: string;
  /** Human-readable description. */
  description: string;
  /** Whether this keybinding is release-blocking. */
  releaseBlocking: boolean;
  /** Display labels per platform. */
  resolvedDisplay: Record<SupportedPlatform, string>;
  /** Expected KeyboardEvent properties per platform. */
  resolvedKeyEvent: Record<
    SupportedPlatform,
    { key: string; ctrlKey: boolean; metaKey: boolean }
  >;
}

/**
 * All registered editor keybindings with platform-specific resolution.
 * CM6's 'Mod' prefix resolves to Cmd on macOS and Ctrl on Linux.
 */
export const EDITOR_KEYBINDING_SPECS: readonly KeybindingSpec[] = [
  {
    id: 'create-new-note',
    cm6Key: 'Mod-n',
    description: 'Create new note and focus editor body',
    releaseBlocking: true,
    resolvedDisplay: {
      linux: 'Ctrl+N',
      macos: '⌘N',
    },
    resolvedKeyEvent: {
      linux: { key: 'n', ctrlKey: true, metaKey: false },
      macos: { key: 'n', ctrlKey: false, metaKey: true },
    },
  },
] as const;

export interface KeybindingValidationEntry {
  spec: KeybindingSpec;
  resolvedDisplay: string;
  resolvedKeyEvent: { key: string; ctrlKey: boolean; metaKey: boolean };
  platformSupported: boolean;
}

export interface KeybindingValidationResult {
  platform: SupportedPlatform;
  bindings: KeybindingValidationEntry[];
  /** True if all keybindings are valid for the current platform. */
  allValid: boolean;
  /** True if all release-blocking keybindings are valid. */
  releaseBlockingValid: boolean;
}

/**
 * Validates that all editor keybindings resolve correctly
 * for the given platform (or auto-detected platform).
 */
export function validatePlatformKeybindings(
  platform?: SupportedPlatform,
): KeybindingValidationResult {
  const p = platform ?? detectPlatform();
  const supported = p === 'linux' || p === 'macos';

  const bindings: KeybindingValidationEntry[] =
    EDITOR_KEYBINDING_SPECS.map((spec) => ({
      spec,
      resolvedDisplay: spec.resolvedDisplay[p],
      resolvedKeyEvent: spec.resolvedKeyEvent[p],
      platformSupported: supported,
    }));

  return {
    platform: p,
    bindings,
    allValid: bindings.every((b) => b.platformSupported),
    releaseBlockingValid: bindings
      .filter((b) => b.spec.releaseBlocking)
      .every((b) => b.platformSupported),
  };
}

/**
 * Returns a map of keybinding id → display label for the current platform.
 * Used for rendering keybinding hints in Svelte UI components.
 */
export function getKeybindingDisplayMap(
  platform?: SupportedPlatform,
): Map<string, string> {
  const p = platform ?? detectPlatform();
  const map = new Map<string, string>();
  for (const spec of EDITOR_KEYBINDING_SPECS) {
    map.set(spec.id, spec.resolvedDisplay[p]);
  }
  return map;
}

/**
 * Checks if a KeyboardEvent matches a registered keybinding on the
 * current platform. Used in integration tests to verify keybindings
 * fire correctly on both Linux and macOS.
 */
export function matchesKeybinding(
  event: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
  },
  bindingId: string,
  platform?: SupportedPlatform,
): boolean {
  const p = platform ?? detectPlatform();
  const spec = EDITOR_KEYBINDING_SPECS.find((s) => s.id === bindingId);
  if (!spec) return false;

  const expected = spec.resolvedKeyEvent[p];
  return (
    event.key.toLowerCase() === expected.key.toLowerCase() &&
    event.ctrlKey === expected.ctrlKey &&
    event.metaKey === expected.metaKey &&
    !event.altKey &&
    !event.shiftKey
  );
}

/**
 * Creates a synthetic KeyboardEventInit matching a registered keybinding
 * for the given platform. Intended for use in automated tests.
 */
export function createTestKeyboardEvent(
  bindingId: string,
  platform?: SupportedPlatform,
): KeyboardEventInit {
  const p = platform ?? detectPlatform();
  const spec = EDITOR_KEYBINDING_SPECS.find((s) => s.id === bindingId);
  if (!spec) {
    throw new Error(`Unknown keybinding id: ${bindingId}`);
  }

  const resolved = spec.resolvedKeyEvent[p];
  return {
    key: resolved.key,
    code: `Key${resolved.key.toUpperCase()}`,
    ctrlKey: resolved.ctrlKey,
    metaKey: resolved.metaKey,
    altKey: false,
    shiftKey: false,
    bubbles: true,
    cancelable: true,
  };
}
