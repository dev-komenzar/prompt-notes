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
// Warns when @tauri-apps/api/core is imported directly outside of
// src/lib/ipc.ts. All invoke() calls must be centralized in ipc.ts so that
// IPC boundary changes are localized to a single file.

import type { Rule } from 'eslint';
import path from 'path';

const ALLOWED_FILE = path.normalize('src/lib/ipc.ts');
const CORE_PACKAGE = '@tauri-apps/api/core';

function isAllowedFile(filename: string): boolean {
  const normalized = path.normalize(filename);
  // Match the file regardless of project root prefix
  return (
    normalized === ALLOWED_FILE ||
    normalized.endsWith(path.sep + ALLOWED_FILE) ||
    // Handle unix-style separator in normalized path on Linux/macOS
    normalized.endsWith('/' + ALLOWED_FILE)
  );
}

const noDirectCoreImport: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when @tauri-apps/api/core is imported directly outside of src/lib/ipc.ts.',
      recommended: true,
      url: 'https://github.com/dev-komenzar/promptnotes',
    },
    messages: {
      noDirectCoreImport:
        'Direct import of "@tauri-apps/api/core" is not allowed outside of src/lib/ipc.ts. ' +
        'Use the typed wrapper functions exported from src/lib/ipc.ts instead. ' +
        'This ensures IPC boundary changes are localized to ipc.ts.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    if (isAllowedFile(filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value === CORE_PACKAGE) {
          context.report({ node, messageId: 'noDirectCoreImport' });
        }
      },
      ImportExpression(node) {
        const source = node.source;
        if (source.type === 'Literal' && source.value === CORE_PACKAGE) {
          context.report({ node, messageId: 'noDirectCoreImport' });
        }
      },
    };
  },
};

export default noDirectCoreImport;
