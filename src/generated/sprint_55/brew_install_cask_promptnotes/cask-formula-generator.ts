// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: `brew install --cask promptnotes` でインストール・起動可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md, docs/governance/adr_tech_stack.md

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as https from "node:https";
import * as path from "node:path";
import type { CaskConfig } from "./cask-config";
import { CASK_DEFAULTS } from "./cask-config";

/**
 * Generates the Homebrew Cask Ruby formula content.
 * Target: macOS only (platform:macos per system design §2.7)
 */
export function generateCaskFormula(config: CaskConfig): string {
  const {
    caskName,
    version,
    sha256,
    urlTemplate,
    appName,
    description,
    homepage,
    zapTrash,
  } = config;

  const url = urlTemplate.includes("#{version}")
    ? urlTemplate
    : CASK_DEFAULTS.urlTemplate(version);

  const zapLines = zapTrash
    .map((p) => `    "${p}",`)
    .join("\n");

  return `cask "${caskName}" do
  version "${version}"
  sha256 "${sha256}"

  url "${url}"
  name "PromptNotes"
  desc "${description}"
  homepage "${homepage}"

  depends_on macos: ">= :ventura"

  app "${appName}"

  zap trash: [
${zapLines}
  ]
end
`;
}

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (u: string) =>
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          request(res.headers.location!);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} downloading ${u}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      });
    request(url).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

export async function computeSha256FromUrl(url: string): Promise<string> {
  const tmpPath = path.join(process.cwd(), ".tmp_dmg_download");
  try {
    await downloadFile(url, tmpPath);
    const buf = fs.readFileSync(tmpPath);
    return createHash("sha256").update(buf).digest("hex");
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}

export function computeSha256FromFile(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

export interface GenerateOptions {
  version: string;
  /** Provide either sha256 directly, or dmgPath/dmgUrl to compute it */
  sha256?: string;
  dmgPath?: string;
  dmgUrl?: string;
  outputPath?: string;
}

export async function generateAndWrite(opts: GenerateOptions): Promise<void> {
  const { version, outputPath } = opts;

  let sha256 = opts.sha256;
  if (!sha256) {
    if (opts.dmgPath) {
      sha256 = computeSha256FromFile(opts.dmgPath);
    } else if (opts.dmgUrl) {
      sha256 = await computeSha256FromUrl(opts.dmgUrl);
    } else {
      throw new Error("Must provide sha256, dmgPath, or dmgUrl");
    }
  }

  const config: CaskConfig = {
    caskName: CASK_DEFAULTS.caskName,
    version,
    sha256,
    urlTemplate: CASK_DEFAULTS.urlTemplate(version),
    appName: CASK_DEFAULTS.appName,
    description: CASK_DEFAULTS.description,
    homepage: CASK_DEFAULTS.homepage,
    zapTrash: [...CASK_DEFAULTS.zapTrash],
  };

  const formula = generateCaskFormula(config);

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, formula, "utf-8");
    console.log(`Wrote cask formula to ${outputPath}`);
  } else {
    process.stdout.write(formula);
  }
}

// CLI entry point: node cask-formula-generator.js --version 1.0.0 --dmg-url <url>
if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const version = get("--version");
  const sha256 = get("--sha256");
  const dmgPath = get("--dmg-path");
  const dmgUrl = get("--dmg-url");
  const outputPath = get("--output");

  if (!version) {
    console.error("Usage: node cask-formula-generator.js --version <ver> [--sha256 <hex>|--dmg-path <path>|--dmg-url <url>] [--output <path>]");
    process.exit(1);
  }

  generateAndWrite({ version, sha256, dmgPath, dmgUrl, outputPath }).catch(
    (err) => {
      console.error(err.message);
      process.exit(1);
    }
  );
}
