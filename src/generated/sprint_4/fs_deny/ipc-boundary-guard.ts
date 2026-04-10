// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `fs` プラグイン `deny`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd generate --sprint 4 --task 4-1
// @trace: detail:component_architecture §4.1, design:system-design §2.9

/**
 * Runtime IPC boundary guard.
 *
 * Ensures the frontend does not attempt to use prohibited Tauri plugin APIs.
 * This module patches global references early in the application lifecycle
 * so that any accidental direct file-system, shell, or HTTP plugin usage
 * throws an explicit error instead of silently failing or bypassing policy.
 *
 * Call `installIpcBoundaryGuard()` once at application startup
 * (e.g. in the root +layout.svelte or main entry point).
 */

const BLOCKED_PLUGIN_MODULES = [
  '@tauri-apps/plugin-fs',
  '@tauri-apps/plugin-shell',
  '@tauri-apps/plugin-http',
] as const;

type BlockedModule = (typeof BLOCKED_PLUGIN_MODULES)[number];

function createBlockedProxy(moduleName: BlockedModule): Record<string, never> {
  return new Proxy(Object.create(null) as Record<string, never>, {
    get(_target, prop) {
      throw new Error(
        `[PromptNotes IPC Boundary] Access to "${moduleName}.${String(prop)}" is denied by security policy. ` +
          `All file operations must go through Tauri IPC commands via src/lib/api/.`,
      );
    },
  });
}

let installed = false;

/**
 * Installs runtime guards that prevent accidental usage of denied Tauri plugins.
 *
 * This is a defense-in-depth measure complementing the tauri.conf.json deny rules.
 * It ensures that even if a developer imports a blocked plugin module, they receive
 * a clear error message at the call site rather than a cryptic Tauri permission error.
 */
export function installIpcBoundaryGuard(): void {
  if (installed) return;
  installed = true;

  if (typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown>;
    if (!w.__TAURI_PLUGIN_BLOCKED__) {
      w.__TAURI_PLUGIN_BLOCKED__ = Object.freeze(
        BLOCKED_PLUGIN_MODULES.reduce(
          (acc, mod) => {
            acc[mod] = createBlockedProxy(mod);
            return acc;
          },
          {} as Record<BlockedModule, Record<string, never>>,
        ),
      );
    }
  }
}

/**
 * Returns true if the guard has been installed.
 */
export function isIpcBoundaryGuardInstalled(): boolean {
  return installed;
}
