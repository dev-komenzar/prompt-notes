// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd implement --sprint 47
// ESLint custom rule: no-browser-storage
//
// Blocks direct access to localStorage, sessionStorage, and indexedDB in
// frontend source files. All settings persistence is handled by the Rust
// backend via invoke('set_config'); browser storage is structurally forbidden.
//
// Registration example (eslint.config.mjs):
//   import noBrowserStorage from './src/generated/sprint_47/module_settings/eslint-rule-no-browser-storage';
//   export default [{ plugins: { local: { rules: { 'no-browser-storage': noBrowserStorage } } },
//                     rules: { 'local/no-browser-storage': 'error' } }];

import type { Rule } from 'eslint';

const FORBIDDEN_GLOBALS = new Set(['localStorage', 'sessionStorage', 'indexedDB']);

const FORBIDDEN_IDB_CLASSES = new Set([
  'IDBFactory',
  'IDBDatabase',
  'IDBObjectStore',
  'IDBTransaction',
  'IDBRequest',
  'IDBOpenDBRequest',
  'IDBKeyRange',
  'IDBCursor',
  'IDBIndex',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow writes to localStorage, sessionStorage, and IndexedDB. ' +
        'Settings persistence must go through the Rust backend via Tauri IPC.',
      recommended: true,
    },
    messages: {
      forbiddenStorage:
        "'{{name}}' is forbidden. Use invoke('set_config') via src/lib/ipc.ts for all persistence.",
      forbiddenIDB:
        "'{{name}}' (IndexedDB) is forbidden. Use invoke('set_config') via src/lib/ipc.ts for all persistence.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      MemberExpression(node) {
        // localStorage.* / sessionStorage.* / indexedDB.*
        if (
          node.object.type === 'Identifier' &&
          FORBIDDEN_GLOBALS.has(node.object.name)
        ) {
          context.report({
            node,
            messageId: 'forbiddenStorage',
            data: { name: node.object.name },
          });
        }

        // window.localStorage / window.sessionStorage / window.indexedDB
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'window' &&
          node.property.type === 'Identifier' &&
          FORBIDDEN_GLOBALS.has(node.property.name)
        ) {
          context.report({
            node,
            messageId: 'forbiddenStorage',
            data: { name: `window.${node.property.name}` },
          });
        }
      },

      NewExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          FORBIDDEN_IDB_CLASSES.has(node.callee.name)
        ) {
          context.report({
            node,
            messageId: 'forbiddenIDB',
            data: { name: node.callee.name },
          });
        }
      },

      Identifier(node) {
        // Bare references to forbidden globals not caught by MemberExpression
        if (
          FORBIDDEN_IDB_CLASSES.has(node.name) &&
          node.parent.type !== 'MemberExpression' &&
          node.parent.type !== 'NewExpression' &&
          node.parent.type !== 'ImportSpecifier' &&
          node.parent.type !== 'ImportDefaultSpecifier' &&
          node.parent.type !== 'ExportSpecifier'
        ) {
          context.report({
            node,
            messageId: 'forbiddenIDB',
            data: { name: node.name },
          });
        }
      },
    };
  },
};

export default rule;
