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

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { buildManifest, renderYaml, APP_ID } from "./manifest";
import { desktopEntry, renderDesktopEntry } from "./desktop-entry";
import { renderAppStream } from "./appstream";

const VERSION = process.env.RELEASE_VERSION ?? "0.1.0";
const SOURCE_COMMIT = process.env.SOURCE_COMMIT ?? "HEAD";
const OUT_DIR = process.env.OUT_DIR ?? "packaging/linux";

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const manifest = buildManifest(VERSION, SOURCE_COMMIT);
  const manifestYaml = renderYaml(manifest);
  const manifestPath = join(OUT_DIR, `${APP_ID}.yml`);
  writeFileSync(manifestPath, manifestYaml, "utf-8");
  console.log(`Written: ${manifestPath}`);

  const desktopContent = renderDesktopEntry(desktopEntry);
  const desktopPath = join(OUT_DIR, `${APP_ID}.desktop`);
  writeFileSync(desktopPath, desktopContent, "utf-8");
  console.log(`Written: ${desktopPath}`);

  const appstreamContent = renderAppStream([
    {
      version: VERSION,
      date: new Date().toISOString().slice(0, 10),
      description: `PromptNotes ${VERSION}`,
    },
  ]);
  const appstreamPath = join(OUT_DIR, `${APP_ID}.appdata.xml`);
  writeFileSync(appstreamPath, appstreamContent, "utf-8");
  console.log(`Written: ${appstreamPath}`);
}

main();
