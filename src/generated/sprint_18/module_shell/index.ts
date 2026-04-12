// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-traceability: sprint:18 task:18-1 module:shell
// ESLint plugin entry point for promptnotes IPC boundary enforcement.
//
// Usage in eslint.config.js (flat config):
//
//   import promptnotesPlugin from './src/generated/sprint_18/module_shell';
//
//   export default [
//     {
//       plugins: { promptnotes: promptnotesPlugin },
//       rules: {
//         'promptnotes/no-plugin-fs': 'error',
//         'promptnotes/no-direct-core-import': 'warn',
//       },
//     },
//   ];

import noPluginFs from './no-plugin-fs';
import noDirectCoreImport from './no-direct-core-import';
import type { Rule } from 'eslint';

interface ESLintPlugin {
  rules: Record<string, Rule.RuleModule>;
  configs: {
    recommended: {
      plugins: string[];
      rules: Record<string, string>;
    };
  };
}

const plugin: ESLintPlugin = {
  rules: {
    'no-plugin-fs': noPluginFs,
    'no-direct-core-import': noDirectCoreImport,
  },
  configs: {
    recommended: {
      plugins: ['promptnotes'],
      rules: {
        // Block: violates release-blocking constraint module:shell / framework:tauri
        'promptnotes/no-plugin-fs': 'error',
        // Warn: ipc.ts is the sole allowed caller of invoke()
        'promptnotes/no-direct-core-import': 'warn',
      },
    },
  },
};

export default plugin;
