import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

/**
 * IPC boundary enforcement — ADR-007
 * フロント側は src/shell/tauri-commands.ts 経由でのみ Tauri API を利用する。
 * @tauri-apps/plugin-* の直接 import を禁止。
 */
const restrictedImportsRule = [
  "error",
  {
    patterns: [
      {
        group: ["@tauri-apps/plugin-*"],
        message:
          "Use src/shell/tauri-commands.ts wrappers instead of importing Tauri plugins directly.",
      },
    ],
    paths: [
      {
        name: "@tauri-apps/plugin-clipboard-manager",
        message: "Use tauri-commands.ts copyToClipboard() instead.",
      },
      {
        name: "@tauri-apps/plugin-dialog",
        message: "Use tauri-commands.ts pickNotesDirectory() instead.",
      },
      {
        name: "@tauri-apps/plugin-global-shortcut",
        message:
          "Use the 'new-note' event from Rust-side registration instead.",
      },
    ],
  },
];

const restrictedGlobalsRule = [
  "error",
  {
    name: "navigator",
    message:
      "Do not access navigator.clipboard or other navigator APIs. Use src/shell/tauri-commands.ts wrappers.",
  },
  {
    name: "__TAURI__",
    message: "Use src/shell/tauri-commands.ts instead of __TAURI__.",
  },
];

export default [
  {
    ignores: [
      "src/generated/**",
      "dist/**",
      ".svelte-kit/**",
      "build/**",
      "src-tauri/target/**",
      "node_modules/**",
      "src-tauri/gen/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs["flat/recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-restricted-imports": restrictedImportsRule,
      "no-restricted-globals": restrictedGlobalsRule,
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      // Existing code uses {#each} without keys — downgrade to warn
      "svelte/require-each-key": "warn",
      // Existing code has useless assignments — downgrade to warn
      "no-useless-assignment": "warn",
      // Existing code uses @ts-ignore — downgrade to warn
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".svelte"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
];
