import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

const restrictedImportsRule = ["error", {
  paths: [
    {
      name: "@tauri-apps/plugin-fs",
      message: "Direct filesystem access from frontend is prohibited. Use tauri-commands.ts IPC wrappers.",
    },
    {
      name: "@tauri-apps/plugin-clipboard-manager",
      message: "Direct clipboard access is prohibited. Use tauri-commands.ts copyToClipboard().",
    },
    {
      name: "@tauri-apps/plugin-dialog",
      message: "Direct dialog access is prohibited. Use tauri-commands.ts pickNotesDirectory().",
    },
    {
      name: "@tauri-apps/plugin-global-shortcut",
      message: "Direct global-shortcut registration from frontend is prohibited. Use 'new-note' event from Rust-side registration.",
    },
  ],
}];

const restrictedGlobalsRule = ["error",
  {
    name: "navigator",
    message: "Do not access navigator.clipboard or other navigator APIs. Use tauri-commands.ts IPC wrappers.",
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
