// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 52-1
// @task-title: Flatpak でインストール・起動可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

/**
 * Verify that the Flatpak packaging artifacts are valid before a release.
 * Run with: npx tsx src/generated/sprint_52/flatpak/verify.ts
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { APP_ID } from "./manifest";

interface VerificationResult {
  passed: boolean;
  checks: CheckResult[];
}

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

function check(name: string, fn: () => void): CheckResult {
  try {
    fn();
    return { name, passed: true, message: "OK" };
  } catch (e) {
    return { name, passed: false, message: (e as Error).message };
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function verify(packagingDir = "packaging/linux"): VerificationResult {
  const checks: CheckResult[] = [];

  checks.push(
    check("Flatpak manifest exists", () => {
      const path = join(packagingDir, `${APP_ID}.yml`);
      assert(existsSync(path), `Missing: ${path}`);
    })
  );

  checks.push(
    check("Manifest contains app ID", () => {
      const path = join(packagingDir, `${APP_ID}.yml`);
      if (!existsSync(path)) throw new Error("File not found");
      const content = readFileSync(path, "utf-8");
      assert(content.includes(`id: ${APP_ID}`), `App ID ${APP_ID} not found in manifest`);
    })
  );

  checks.push(
    check("Manifest has required finish-args for filesystem", () => {
      const path = join(packagingDir, `${APP_ID}.yml`);
      if (!existsSync(path)) throw new Error("File not found");
      const content = readFileSync(path, "utf-8");
      assert(
        content.includes("--filesystem=~/.local/share/promptnotes"),
        "Missing filesystem permission for default notes directory"
      );
    })
  );

  checks.push(
    check("Manifest does NOT grant network access", () => {
      const path = join(packagingDir, `${APP_ID}.yml`);
      if (!existsSync(path)) throw new Error("File not found");
      const content = readFileSync(path, "utf-8");
      assert(
        !content.includes("--share=network"),
        "Manifest must NOT grant network access — PromptNotes is fully local"
      );
    })
  );

  checks.push(
    check("Desktop entry exists", () => {
      const path = join(packagingDir, `${APP_ID}.desktop`);
      assert(existsSync(path), `Missing: ${path}`);
    })
  );

  checks.push(
    check("Desktop entry has correct app ID", () => {
      const path = join(packagingDir, `${APP_ID}.desktop`);
      if (!existsSync(path)) throw new Error("File not found");
      const content = readFileSync(path, "utf-8");
      assert(content.includes(`Icon=${APP_ID}`), "Desktop entry must use app ID as icon name");
    })
  );

  checks.push(
    check("AppStream metadata exists", () => {
      const path = join(packagingDir, `${APP_ID}.appdata.xml`);
      assert(existsSync(path), `Missing: ${path}`);
    })
  );

  checks.push(
    check("AppStream metadata has content_rating", () => {
      const path = join(packagingDir, `${APP_ID}.appdata.xml`);
      if (!existsSync(path)) throw new Error("File not found");
      const content = readFileSync(path, "utf-8");
      assert(content.includes("<content_rating"), "Missing content_rating — required for Flathub submission");
    })
  );

  const passed = checks.every((c) => c.passed);
  return { passed, checks };
}

if (require.main === module) {
  const result = verify();
  for (const c of result.checks) {
    const icon = c.passed ? "✓" : "✗";
    console.log(`  ${icon} ${c.name}${c.passed ? "" : `: ${c.message}`}`);
  }
  console.log("");
  if (result.passed) {
    console.log("All Flatpak packaging checks passed.");
  } else {
    console.error("Flatpak packaging verification FAILED. Run generate.ts first.");
    process.exit(1);
  }
}
