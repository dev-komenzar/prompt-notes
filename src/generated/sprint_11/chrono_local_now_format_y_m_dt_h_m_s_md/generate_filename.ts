// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `chrono::Local::now().format("%Y-%m-%dT%H%M%S.md")` によるファイル名生成。同一秒衝突時のミリ秒サフィックス付与ロジック。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 11
// @task: 11-1
// @description: chrono::Local::now().format("%Y-%m-%dT%H%M%S.md") によるファイル名生成。同一秒衝突時のミリ秒サフィックス付与ロジック。

/**
 * Generates a filename in the format YYYY-MM-DDTHHMMSS.md from the current local time.
 * Mirrors the Rust-side `chrono::Local::now().format("%Y-%m-%dT%H%M%S.md")` behavior.
 */
export function formatTimestampFilename(date: Date): string {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}${mi}${ss}.md`;
}

/**
 * Generates a filename with a millisecond suffix for collision avoidance.
 * Format: YYYY-MM-DDTHHMMSS_NNN.md where NNN is zero-padded milliseconds.
 */
export function formatTimestampFilenameWithMillis(date: Date): string {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${yyyy}-${mm}-${dd}T${hh}${mi}${ss}_${ms}.md`;
}

/**
 * Generates a unique filename by checking existing filenames for collisions.
 * If the base filename (second-precision) already exists in the provided set,
 * a millisecond suffix is appended to avoid collision.
 *
 * @param now - The current date/time to derive the filename from.
 * @param existingFilenames - A set or array of filenames already present in the notes directory.
 * @returns A unique filename in YYYY-MM-DDTHHMMSS.md or YYYY-MM-DDTHHMMSS_NNN.md format.
 */
export function generateFilename(
  now: Date,
  existingFilenames: ReadonlySet<string> | readonly string[],
): string {
  const existing =
    existingFilenames instanceof Set
      ? existingFilenames
      : new Set(existingFilenames);

  const base = formatTimestampFilename(now);

  if (!existing.has(base)) {
    return base;
  }

  const withMillis = formatTimestampFilenameWithMillis(now);

  if (!existing.has(withMillis)) {
    return withMillis;
  }

  // Extremely unlikely: both base and millis-suffixed collide.
  // Increment millisecond suffix until a unique name is found.
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const prefix = `${yyyy}-${mm}-${dd}T${hh}${mi}${ss}`;

  for (let i = 0; i <= 999; i++) {
    const suffix = String(i).padStart(3, '0');
    const candidate = `${prefix}_${suffix}.md`;
    if (!existing.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Failed to generate unique filename: all 1000 millisecond slots exhausted for ${prefix}`,
  );
}
