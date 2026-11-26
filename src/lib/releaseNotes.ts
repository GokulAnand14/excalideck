export interface ReleaseNoteLine {
  kind: "heading" | "bullet" | "text";
  content: string;
}

/**
 * Formats GitHub/Tauri Markdown release notes into clean structured lines
 * without pulling in a full markdown runtime.
 */
export function parseReleaseNotes(raw?: string): ReleaseNoteLine[] {
  if (!raw) return [];
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const result: ReleaseNoteLine[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip GitHub auto-generated full changelog footer URLs
    if (/^\*{0,2}Full Changelog\*{0,2}:/i.test(trimmed)) {
      continue;
    }

    // Strip markdown links [text](url) -> text, and PR URLs -> #123
    const cleanText = trimmed
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/https?:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/(\d+)/g, "#$1")
      .replace(/\s+by\s+@[\w-]+\s+in\s+(#\d+)/g, " ($1)")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");

    const headingMatch = cleanText.match(/^#{1,4}\s+(.*)$/);
    if (headingMatch) {
      result.push({ kind: "heading", content: headingMatch[1].trim() });
      continue;
    }

    const bulletMatch = cleanText.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      result.push({ kind: "bullet", content: bulletMatch[1].trim() });
      continue;
    }

    result.push({ kind: "text", content: cleanText });
  }

  return result;
}

export function formatReleaseDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
