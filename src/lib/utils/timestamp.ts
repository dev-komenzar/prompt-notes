const FILENAME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})\.md$/;

export function filenameToDate(filename: string): Date {
  const m = filename.match(FILENAME_RE);
  if (!m) throw new Error(`Invalid filename: ${filename}`);
  const [, y, mo, d, h, mi, s] = m;
  return new Date(+y, +mo - 1, +d, +h, +mi, +s);
}

export function dateToFilenamePrefix(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
}

export function formatTimestamp(createdAt: string): string {
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return createdAt;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
