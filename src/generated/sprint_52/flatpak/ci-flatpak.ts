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
 * GitHub Actions workflow definition for Flatpak build.
 * Renders the YAML for .github/workflows/flatpak.yml.
 *
 * Produces: com.promptnotes.PromptNotes.flatpak bundle artifact.
 * Platform: Linux only (macOS and Windows are not Flatpak targets).
 */

import { APP_ID } from "./manifest";

export interface WorkflowJob {
  name: string;
  "runs-on": string;
  steps: WorkflowStep[];
  needs?: string[];
  if?: string;
  permissions?: Record<string, string>;
}

export interface WorkflowStep {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, string | boolean | number>;
  env?: Record<string, string>;
  id?: string;
}

export function buildFlatpakWorkflow(): string {
  const lines: string[] = [];

  lines.push("name: Flatpak Build");
  lines.push("");
  lines.push("on:");
  lines.push("  push:");
  lines.push("    tags:");
  lines.push("      - 'v*'");
  lines.push("  workflow_dispatch:");
  lines.push("    inputs:");
  lines.push("      version:");
  lines.push("        description: 'Release version (e.g. 0.1.0)'");
  lines.push("        required: true");
  lines.push("");
  lines.push("jobs:");
  lines.push("  build-flatpak:");
  lines.push("    name: Build Flatpak bundle");
  lines.push("    runs-on: ubuntu-22.04");
  lines.push("    container:");
  lines.push("      image: bilelmoussaoui/flatpak-github-actions:gnome-47");
  lines.push("      options: --privileged");
  lines.push("    steps:");
  lines.push("      - name: Checkout");
  lines.push("        uses: actions/checkout@v4");
  lines.push("");
  lines.push("      - name: Generate packaging files");
  lines.push("        env:");
  lines.push("          RELEASE_VERSION: ${{ github.ref_name || inputs.version }}");
  lines.push("          SOURCE_COMMIT: ${{ github.sha }}");
  lines.push("          OUT_DIR: packaging/linux");
  lines.push("        run: npx tsx src/generated/sprint_52/flatpak/generate.ts");
  lines.push("");
  lines.push("      - name: Install Flatpak SDK extensions");
  lines.push("        run: |");
  lines.push("          flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo");
  lines.push(`          flatpak install -y flathub ${APP_ID.split(".").slice(0, -1).join(".")}.Sdk//47 || true`);
  lines.push("          flatpak install -y flathub org.freedesktop.Sdk.Extension.rust-stable//24.08");
  lines.push("          flatpak install -y flathub org.freedesktop.Sdk.Extension.node20//24.08");
  lines.push("");
  lines.push("      - name: Cache Cargo registry");
  lines.push("        uses: actions/cache@v4");
  lines.push("        with:");
  lines.push("          path: |");
  lines.push("            ~/.cargo/registry");
  lines.push("            ~/.cargo/git");
  lines.push("          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}");
  lines.push("");
  lines.push("      - name: Build Flatpak");
  lines.push("        uses: bilelmoussaoui/flatpak-github-actions/flatpak-builder@v6");
  lines.push("        with:");
  lines.push(`          manifest-path: packaging/linux/${APP_ID}.yml`);
  lines.push(`          bundle: ${APP_ID}.flatpak`);
  lines.push("          upload-artifact: true");
  lines.push("          cache-key: flatpak-builder-${{ github.sha }}");
  lines.push("");
  lines.push("      - name: Upload Flatpak bundle");
  lines.push("        uses: actions/upload-artifact@v4");
  lines.push("        with:");
  lines.push(`          name: ${APP_ID}-flatpak`);
  lines.push(`          path: ${APP_ID}.flatpak`);
  lines.push("          retention-days: 30");

  return lines.join("\n") + "\n";
}

if (require.main === module) {
  const { writeFileSync, mkdirSync } = require("fs");
  mkdirSync(".github/workflows", { recursive: true });
  const workflow = buildFlatpakWorkflow();
  writeFileSync(".github/workflows/flatpak.yml", workflow, "utf-8");
  console.log("Written: .github/workflows/flatpak.yml");
}
