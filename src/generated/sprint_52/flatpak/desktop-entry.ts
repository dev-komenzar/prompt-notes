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

import { APP_ID } from "./manifest";

export interface DesktopEntry {
  Name: string;
  Comment: string;
  Exec: string;
  Icon: string;
  Terminal: boolean;
  Type: string;
  Categories: string[];
  Keywords: string[];
  StartupWMClass: string;
}

export const desktopEntry: DesktopEntry = {
  Name: "PromptNotes",
  Comment: "Quick note-taking for AI prompts",
  Exec: "promptnotes",
  Icon: APP_ID,
  Terminal: false,
  Type: "Application",
  Categories: ["Office", "TextEditor", "Utility"],
  Keywords: ["notes", "prompt", "ai", "markdown", "editor"],
  StartupWMClass: "promptnotes",
};

export function renderDesktopEntry(entry: DesktopEntry): string {
  const lines: string[] = [
    "[Desktop Entry]",
    `Name=${entry.Name}`,
    `Comment=${entry.Comment}`,
    `Exec=${entry.Exec}`,
    `Icon=${entry.Icon}`,
    `Terminal=${entry.Terminal}`,
    `Type=${entry.Type}`,
    `Categories=${entry.Categories.join(";")};`,
    `Keywords=${entry.Keywords.join(";")};`,
    `StartupWMClass=${entry.StartupWMClass}`,
  ];
  return lines.join("\n") + "\n";
}
