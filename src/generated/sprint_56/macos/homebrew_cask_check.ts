// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-4
// @task-title: macOS 両プラットフォームでパッケージ配布可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md, docs/governance/adr_tech_stack.md
// Sprint 56 Task 56-4: macOS Homebrew Cask distribution check

export interface HomebrewCaskFormula {
  cask: string;
  version: string;
  sha256: string;
  url: string;
  name: string[];
  desc: string;
  homepage: string;
  app: string;
  zap?: { trash: string[] };
}

export interface HomebrewCaskValidationResult {
  formulaFound: boolean;
  formulaPath: string;
  formulaContent: HomebrewCaskFormula | null;
  validations: HomebrewCaskValidation[];
  errors: string[];
  passed: boolean;
}

export interface HomebrewCaskValidation {
  field: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export const HOMEBREW_CASK_NAME = "promptnotes";
export const HOMEBREW_CASK_PATH = "Casks/promptnotes.rb";
export const HOMEBREW_TAP = "homebrew/cask";
export const HOMEBREW_BUNDLE_ID = "com.promptnotes.PromptNotes";

export const EXPECTED_CASK_FORMULA: Omit<HomebrewCaskFormula, "version" | "sha256" | "url"> = {
  cask: HOMEBREW_CASK_NAME,
  name: ["PromptNotes"],
  desc: "Local note-taking app for AI prompts",
  homepage: "https://github.com/dev-komenzar/promptnotes",
  app: "PromptNotes.app",
  zap: {
    trash: [
      "~/Library/Application Support/promptnotes",
      "~/.config/promptnotes",
    ],
  },
};

export function validateCaskFormula(formula: HomebrewCaskFormula): HomebrewCaskValidationResult {
  const validations: HomebrewCaskValidation[] = [];
  const errors: string[] = [];

  const checks: Array<{ field: keyof typeof EXPECTED_CASK_FORMULA; expected: string; actual: string }> = [
    {
      field: "cask",
      expected: EXPECTED_CASK_FORMULA.cask,
      actual: formula.cask,
    },
    {
      field: "desc",
      expected: EXPECTED_CASK_FORMULA.desc,
      actual: formula.desc,
    },
    {
      field: "homepage",
      expected: EXPECTED_CASK_FORMULA.homepage,
      actual: formula.homepage,
    },
    {
      field: "app",
      expected: EXPECTED_CASK_FORMULA.app,
      actual: formula.app,
    },
  ];

  for (const check of checks) {
    const passed = check.expected === check.actual;
    validations.push({ field: check.field, expected: check.expected, actual: check.actual, passed });
    if (!passed) {
      errors.push(`Cask field '${check.field}': expected '${check.expected}', got '${check.actual}'`);
    }
  }

  if (!formula.url || !formula.url.includes("github.com")) {
    errors.push("Cask 'url' must point to a GitHub release asset");
    validations.push({ field: "url", expected: "github.com release URL", actual: formula.url, passed: false });
  } else {
    validations.push({ field: "url", expected: "github.com release URL", actual: formula.url, passed: true });
  }

  if (!formula.sha256 || formula.sha256.length !== 64) {
    errors.push("Cask 'sha256' must be a valid 64-character SHA-256 hex string");
    validations.push({
      field: "sha256",
      expected: "64-char hex",
      actual: formula.sha256,
      passed: false,
    });
  } else {
    validations.push({ field: "sha256", expected: "64-char hex", actual: formula.sha256, passed: true });
  }

  if (!formula.version || formula.version === "") {
    errors.push("Cask 'version' must be set");
    validations.push({ field: "version", expected: "semver", actual: formula.version, passed: false });
  } else {
    validations.push({ field: "version", expected: "semver", actual: formula.version, passed: true });
  }

  const zapPaths = formula.zap?.trash ?? [];
  const hasAppSupportZap = zapPaths.some((p) => p.includes("Library/Application Support/promptnotes"));
  if (!hasAppSupportZap) {
    errors.push(
      "Cask 'zap.trash' must include '~/Library/Application Support/promptnotes' for clean uninstall"
    );
    validations.push({
      field: "zap.trash",
      expected: "includes ~/Library/Application Support/promptnotes",
      actual: JSON.stringify(zapPaths),
      passed: false,
    });
  } else {
    validations.push({
      field: "zap.trash",
      expected: "includes ~/Library/Application Support/promptnotes",
      actual: JSON.stringify(zapPaths),
      passed: true,
    });
  }

  return {
    formulaFound: true,
    formulaPath: HOMEBREW_CASK_PATH,
    formulaContent: formula,
    validations,
    errors,
    passed: errors.length === 0,
  };
}

export function checkHomebrewCask(formula: HomebrewCaskFormula | null): HomebrewCaskValidationResult {
  if (!formula) {
    return {
      formulaFound: false,
      formulaPath: HOMEBREW_CASK_PATH,
      formulaContent: null,
      validations: [],
      errors: [
        `RELEASE_BLOCKER: Homebrew Cask formula not found at '${HOMEBREW_CASK_PATH}'`,
        "RELEASE_BLOCKER: macOS Homebrew Cask is a required distribution channel (AC-DI-02)",
      ],
      passed: false,
    };
  }

  return validateCaskFormula(formula);
}

export function generateCaskRubyTemplate(
  version: string,
  sha256: string,
  downloadUrl: string,
): string {
  return `cask "${HOMEBREW_CASK_NAME}" do
  version "${version}"
  sha256 "${sha256}"

  url "${downloadUrl}"
  name "PromptNotes"
  desc "Local note-taking app for AI prompts"
  homepage "${EXPECTED_CASK_FORMULA.homepage}"

  app "${EXPECTED_CASK_FORMULA.app}"

  zap trash: [
    "~/Library/Application Support/promptnotes",
    "~/.config/promptnotes",
  ]
end
`;
}
