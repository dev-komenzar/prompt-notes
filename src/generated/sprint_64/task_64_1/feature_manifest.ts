// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 64-1
// @task-title: —
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=64, task=64-1, module=release_notes
// Dependency: test:acceptance_criteria, detail:editor_clipboard, detail:grid_search, detail:storage_fileformat

import type { FeatureEntry } from './types';

export const FEATURES: readonly FeatureEntry[] = [
  // module:editor features
  {
    id: 'FEAT-ED-01',
    module: 'editor',
    title: 'CodeMirror 6 Markdown Editor',
    description:
      'Plain-text Markdown editing powered by CodeMirror 6 with @codemirror/lang-markdown syntax highlighting. No HTML rendering or preview pane.',
    releaseBlocking: true,
    constraintIds: ['RBC-2', 'CONV-2'],
    acceptanceCriteriaIds: ['AC-ED-01'],
  },
  {
    id: 'FEAT-ED-02',
    module: 'editor',
    title: 'No Title Input Field',
    description:
      'Editor screen consists only of frontmatter region and body region. No dedicated title input field exists.',
    releaseBlocking: true,
    constraintIds: ['RBC-2'],
    acceptanceCriteriaIds: ['AC-ED-02'],
  },
  {
    id: 'FEAT-ED-03',
    module: 'editor',
    title: 'Frontmatter Visual Distinction',
    description:
      'YAML frontmatter region (--- delimited) is visually distinguished from the note body via background color decoration using CodeMirror 6 ViewPlugin/Decoration API.',
    releaseBlocking: true,
    constraintIds: [],
    acceptanceCriteriaIds: ['AC-ED-03'],
  },
  {
    id: 'FEAT-ED-04',
    module: 'editor',
    title: 'Instant New Note Creation (Cmd+N / Ctrl+N)',
    description:
      'Pressing Cmd+N (macOS) or Ctrl+N (Linux) immediately creates a new note via create_note IPC command, loads an empty frontmatter template, and focuses the body area with no perceptible delay.',
    releaseBlocking: true,
    constraintIds: ['RBC-1'],
    acceptanceCriteriaIds: ['AC-ED-04'],
  },
  {
    id: 'FEAT-ED-05',
    module: 'editor',
    title: '1-Click Copy Button',
    description:
      'A single copy button on the editor screen copies the entire document text to the system clipboard via navigator.clipboard.writeText(). This is the core UX of the application.',
    releaseBlocking: true,
    constraintIds: ['RBC-1'],
    acceptanceCriteriaIds: ['AC-ED-05'],
  },
  {
    id: 'FEAT-ED-06',
    module: 'editor',
    title: 'Auto-Save with Debounce',
    description:
      'Editor content is automatically saved via save_note IPC command with 500ms debounce on EditorView.updateListener change detection. No manual save action required.',
    releaseBlocking: true,
    constraintIds: ['RBC-3'],
    acceptanceCriteriaIds: ['AC-ED-06'],
  },
  // module:grid features
  {
    id: 'FEAT-GR-01',
    module: 'grid',
    title: 'Pinterest-Style Masonry Card Layout',
    description:
      'Variable-height card layout using CSS Columns for a Pinterest-style masonry grid. Each card displays body_preview, tags badges, and created_at timestamp.',
    releaseBlocking: true,
    constraintIds: ['CONV-GRID-1'],
    acceptanceCriteriaIds: ['AC-GR-01'],
  },
  {
    id: 'FEAT-GR-02',
    module: 'grid',
    title: 'Default 7-Day Filter',
    description:
      'Grid view defaults to displaying notes from the last 7 days on mount, calculated from JavaScript Date and passed as from_date/to_date to list_notes IPC command.',
    releaseBlocking: true,
    constraintIds: ['RBC-4', 'CONV-GRID-1'],
    acceptanceCriteriaIds: ['AC-GR-02'],
  },
  {
    id: 'FEAT-GR-03',
    module: 'grid',
    title: 'Tag Filter',
    description:
      'Tag selection UI (TagFilter.svelte) allows filtering notes by tag via the list_notes IPC command tag parameter.',
    releaseBlocking: true,
    constraintIds: ['RBC-4', 'CONV-GRID-2'],
    acceptanceCriteriaIds: ['AC-GR-03'],
  },
  {
    id: 'FEAT-GR-04',
    module: 'grid',
    title: 'Date Range Filter',
    description:
      'Date range selection UI (DateFilter.svelte) allows filtering notes by arbitrary date range beyond the default 7-day window.',
    releaseBlocking: true,
    constraintIds: ['RBC-4', 'CONV-GRID-2'],
    acceptanceCriteriaIds: ['AC-GR-04'],
  },
  {
    id: 'FEAT-GR-05',
    module: 'grid',
    title: 'Full-Text Search',
    description:
      'Search text box with 300ms debounce triggers search_notes IPC command for Rust-side full file scan using case-insensitive str::contains. No index engine.',
    releaseBlocking: true,
    constraintIds: ['RBC-4', 'CONV-GRID-2'],
    acceptanceCriteriaIds: ['AC-GR-05'],
  },
  {
    id: 'FEAT-GR-06',
    module: 'grid',
    title: 'Card Click to Editor Navigation',
    description:
      'Clicking a NoteCard dispatches card-click event, setting App.svelte currentView to editor with selectedFilename. Editor.svelte then loads the note via read_note IPC.',
    releaseBlocking: true,
    constraintIds: ['CONV-GRID-3'],
    acceptanceCriteriaIds: ['AC-GR-06'],
  },
  // module:storage features
  {
    id: 'FEAT-ST-01',
    module: 'storage',
    title: 'Timestamp-Based Filename (YYYY-MM-DDTHHMMSS.md)',
    description:
      'Note filenames are generated exclusively by Rust backend using chrono crate with format %Y-%m-%dT%H%M%S. Filenames are immutable after creation. Collision avoidance via _N suffix.',
    releaseBlocking: true,
    constraintIds: ['RBC-3', 'CONV-FILENAME'],
    acceptanceCriteriaIds: ['AC-ST-01'],
  },
  {
    id: 'FEAT-ST-02',
    module: 'storage',
    title: 'YAML Frontmatter with tags Only',
    description:
      'Frontmatter is YAML format with only the tags field. Created date is derived from filename. Unknown fields are tolerated but not used. Parse errors fall back to tags: [].',
    releaseBlocking: true,
    constraintIds: ['CONV-FRONTMATTER'],
    acceptanceCriteriaIds: ['AC-ST-02'],
  },
  {
    id: 'FEAT-ST-03',
    module: 'storage',
    title: 'OS-Standard Default Directories',
    description:
      'Default notes directory uses dirs::data_dir(). Linux: ~/.local/share/promptnotes/notes/, macOS: ~/Library/Application Support/promptnotes/notes/. Auto-created on first launch.',
    releaseBlocking: true,
    constraintIds: ['CONV-DIRECTORY'],
    acceptanceCriteriaIds: ['AC-ST-03'],
  },
  {
    id: 'FEAT-ST-04',
    module: 'storage',
    title: 'Obsidian / VSCode Compatibility',
    description:
      'Saved .md files use standard YAML frontmatter + Markdown body format, directly openable in Obsidian and VSCode. Compatible with Git version control.',
    releaseBlocking: true,
    constraintIds: [],
    acceptanceCriteriaIds: ['AC-ST-04'],
  },
  {
    id: 'FEAT-ST-05',
    module: 'storage',
    title: 'Path Traversal Prevention',
    description:
      'All filename arguments validated against regex ^\\d{4}-\\d{2}-\\d{2}T\\d{6}(_\\d+)?\\.md$. Paths containing .. or / are rejected. File operations confined to notes_dir.',
    releaseBlocking: false,
    constraintIds: ['CONV-1'],
    acceptanceCriteriaIds: [],
  },
  // module:settings features
  {
    id: 'FEAT-SE-01',
    module: 'settings',
    title: 'Notes Directory Configuration',
    description:
      'Settings screen allows changing the notes directory via Tauri file dialog API. Path validation and persistence handled exclusively by Rust backend via set_config IPC command.',
    releaseBlocking: true,
    constraintIds: ['CONV-2', 'CONV-DIRECTORY'],
    acceptanceCriteriaIds: ['AC-SE-01'],
  },
  // module:shell features
  {
    id: 'FEAT-SH-01',
    module: 'shell',
    title: 'Tauri IPC Boundary Enforcement',
    description:
      'All frontend-to-backend communication goes through Tauri IPC invoke(). Direct filesystem access from WebView is prohibited via Tauri allowlist/permissions. All IPC calls routed through lib/api.ts.',
    releaseBlocking: true,
    constraintIds: ['CONV-1'],
    acceptanceCriteriaIds: ['AC-TF-01'],
  },
] as const;

export function getFeaturesByModule(
  module: FeatureEntry['module']
): readonly FeatureEntry[] {
  return FEATURES.filter((f) => f.module === module);
}

export function getReleaseBlockingFeatures(): readonly FeatureEntry[] {
  return FEATURES.filter((f) => f.releaseBlocking);
}

export function formatFeatureList(features: readonly FeatureEntry[]): string {
  const lines: string[] = [];
  for (const f of features) {
    const blocking = f.releaseBlocking ? ' 🚫' : '';
    lines.push(`- **${f.title}**${blocking}`);
    lines.push(`  ${f.description}`);
  }
  return lines.join('\n');
}
