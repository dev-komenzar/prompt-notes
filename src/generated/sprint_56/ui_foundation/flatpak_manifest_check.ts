// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-3
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md §2.7, docs/requirements/requirements.md
// Sprint 56 Task 56-3: Flatpak distribution check

export interface FlatpakManifest {
  appId: string;
  runtime: string;
  runtimeVersion: string;
  sdk: string;
  command: string;
  finishArgs: string[];
  modules: FlatpakModule[];
}

export interface FlatpakModule {
  name: string;
  buildSystem: string;
}

export interface FlatpakCheckResult {
  manifestPresent: boolean;
  appIdCorrect: boolean;
  sandboxPermissionsAppropriate: boolean;
  homescopeGranted: boolean;
  networkDenied: boolean;
  allPassed: boolean;
  failures: string[];
  warnings: string[];
}

const EXPECTED_APP_ID = "com.promptnotes.PromptNotes";
const EXPECTED_MANIFEST_PATH = "flatpak/com.promptnotes.PromptNotes.yml";

// PromptNotes requires home filesystem access for notes directory.
// Network access must be denied (privacy constraint: no network communication).
const REQUIRED_FINISH_ARGS = ["--filesystem=home"];
const FORBIDDEN_FINISH_ARGS = ["--share=network", "--socket=pulseaudio"];

export function checkFlatpakManifest(input: {
  manifestPresent: boolean;
  manifest?: FlatpakManifest;
}): FlatpakCheckResult {
  const failures: string[] = [];
  const warnings: string[] = [];

  if (!input.manifestPresent) {
    failures.push(
      `Flatpak manifest not found at '${EXPECTED_MANIFEST_PATH}' — create for Flathub distribution`
    );
    return {
      manifestPresent: false,
      appIdCorrect: false,
      sandboxPermissionsAppropriate: false,
      homescopeGranted: false,
      networkDenied: true,
      allPassed: false,
      failures,
      warnings,
    };
  }

  const manifest = input.manifest!;

  const appIdCorrect = manifest.appId === EXPECTED_APP_ID;
  if (!appIdCorrect) {
    failures.push(
      `Flatpak appId must be '${EXPECTED_APP_ID}', got '${manifest.appId}'`
    );
  }

  const finishArgs = manifest.finishArgs ?? [];

  const homescopeGranted = REQUIRED_FINISH_ARGS.every((arg) =>
    finishArgs.includes(arg)
  );
  if (!homescopeGranted) {
    failures.push(
      "Flatpak finish-args must include '--filesystem=home' for notes directory access"
    );
  }

  const networkDenied = !finishArgs.includes("--share=network");
  if (!networkDenied) {
    failures.push(
      "Flatpak finish-args must NOT include '--share=network' — PromptNotes makes no network calls (privacy constraint)"
    );
  }

  for (const forbidden of FORBIDDEN_FINISH_ARGS) {
    if (forbidden !== "--share=network" && finishArgs.includes(forbidden)) {
      warnings.push(
        `Flatpak finish-args includes '${forbidden}' which may not be required — verify necessity`
      );
    }
  }

  const sandboxPermissionsAppropriate = homescopeGranted && networkDenied;

  return {
    manifestPresent: true,
    appIdCorrect,
    sandboxPermissionsAppropriate,
    homescopeGranted,
    networkDenied,
    allPassed: failures.length === 0,
    failures,
    warnings,
  };
}

export interface FlatpakMetadataCheck {
  desktopFilePresent: boolean;
  appstreamXmlPresent: boolean;
  iconsPresent: boolean;
  allPassed: boolean;
  failures: string[];
}

export function checkFlatpakMetadata(input: {
  desktopFilePresent: boolean;
  appstreamXmlPresent: boolean;
  iconsPresent: boolean;
}): FlatpakMetadataCheck {
  const failures: string[] = [];

  if (!input.desktopFilePresent) {
    failures.push(
      `Missing .desktop file at 'flatpak/${EXPECTED_APP_ID}.desktop' — required for Flathub submission`
    );
  }
  if (!input.appstreamXmlPresent) {
    failures.push(
      `Missing AppStream XML at 'flatpak/${EXPECTED_APP_ID}.metainfo.xml' — required for Flathub submission`
    );
  }
  if (!input.iconsPresent) {
    failures.push(
      "Missing application icons (64x64, 128x128 PNG) — required for Flathub submission"
    );
  }

  return {
    ...input,
    allPassed: failures.length === 0,
    failures,
  };
}
