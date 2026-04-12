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
// Enforces the IPC boundary: @tauri-apps/plugin-fs must never be imported in
// frontend code. All file operations must go through the Rust backend via
// Tauri IPC (src/lib/ipc.ts).

import type { Rule } from 'eslint';

const noPluginFs: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow direct import of @tauri-apps/plugin-fs. All file operations must use Rust backend via ipc.ts.',
      recommended: true,
      url: 'https://github.com/dev-komenzar/promptnotes',
    },
    messages: {
      noPluginFsImport:
        'Direct import of "@tauri-apps/plugin-fs" is forbidden. ' +
        'All file operations must go through the Rust backend via src/lib/ipc.ts. ' +
        'This is a release-blocking constraint (module:shell / framework:tauri).',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === '@tauri-apps/plugin-fs') {
          context.report({ node, messageId: 'noPluginFsImport' });
        }
      },
      // Also catch dynamic imports: import('@tauri-apps/plugin-fs')
      ImportExpression(node) {
        const source = node.source;
        if (
          source.type === 'Literal' &&
          source.value === '@tauri-apps/plugin-fs'
        ) {
          context.report({ node, messageId: 'noPluginFsImport' });
        }
      },
    };
  },
};

export default noPluginFs;
