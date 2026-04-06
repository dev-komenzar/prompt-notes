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
// Dependency: design:system-design (§2.2.1), detail:component_architecture (§3.3)

export interface IpcCommandSpec {
  readonly command: string;
  readonly ownerModule: 'storage' | 'settings';
  readonly args: string;
  readonly returnType: string;
  readonly calledBy: readonly string[];
  readonly description: string;
}

export const IPC_COMMANDS: readonly IpcCommandSpec[] = [
  {
    command: 'create_note',
    ownerModule: 'storage',
    args: 'none',
    returnType: '{ filename: string, path: string }',
    calledBy: ['module:editor'],
    description:
      'Creates a new note file with YYYY-MM-DDTHHMMSS.md filename and empty frontmatter template.',
  },
  {
    command: 'save_note',
    ownerModule: 'storage',
    args: '{ filename: string, content: string }',
    returnType: 'void',
    calledBy: ['module:editor'],
    description:
      'Overwrites the specified note file with the given content. Filename validated against regex.',
  },
  {
    command: 'read_note',
    ownerModule: 'storage',
    args: '{ filename: string }',
    returnType: '{ content: string }',
    calledBy: ['module:editor'],
    description:
      'Reads and returns the full content of the specified note file.',
  },
  {
    command: 'delete_note',
    ownerModule: 'storage',
    args: '{ filename: string }',
    returnType: 'void',
    calledBy: ['module:editor', 'module:grid'],
    description:
      'Physically deletes the specified note file. No soft-delete or trash.',
  },
  {
    command: 'list_notes',
    ownerModule: 'storage',
    args: '{ from_date?: string, to_date?: string, tag?: string }',
    returnType: 'NoteEntry[]',
    calledBy: ['module:grid'],
    description:
      'Scans .md files in notes_dir, filters by date range and tag, parses frontmatter, returns sorted NoteEntry array (descending by created_at).',
  },
  {
    command: 'search_notes',
    ownerModule: 'storage',
    args: '{ query: string, from_date?: string, to_date?: string, tag?: string }',
    returnType: 'NoteEntry[]',
    calledBy: ['module:grid'],
    description:
      'Full file scan search using case-insensitive str::contains. Combines with date/tag filters.',
  },
  {
    command: 'get_config',
    ownerModule: 'settings',
    args: 'none',
    returnType: 'Config',
    calledBy: ['module:settings UI'],
    description:
      'Returns current application configuration (notes_dir).',
  },
  {
    command: 'set_config',
    ownerModule: 'settings',
    args: '{ notes_dir: string }',
    returnType: 'void',
    calledBy: ['module:settings UI'],
    description:
      'Updates notes directory after Rust-side path existence and write permission validation. Persists to config.json.',
  },
] as const;

export function formatIpcCommandTable(commands: readonly IpcCommandSpec[]): string {
  const lines: string[] = [];
  lines.push('| Command | Owner | Args | Return | Called By |');
  lines.push('|---------|-------|------|--------|----------|');
  for (const cmd of commands) {
    lines.push(
      `| \`${cmd.command}\` | ${cmd.ownerModule} | \`${cmd.args}\` | \`${cmd.returnType}\` | ${cmd.calledBy.join(', ')} |`
    );
  }
  return lines.join('\n');
}
