/**
 * Parses a GitHub-style unified diff `patch` string into an array of hunks,
 * each containing lines tagged with a type ('add' | 'remove' | 'context')
 * and their old/new line numbers, so the UI can render a GitHub-like
 * side-by-side-free (inline) diff with correct line numbering.
 */
export function parsePatch(patch) {
  if (!patch) return [];

  const hunks = [];
  let current = null;

  for (const rawLine of patch.split('\n')) {
    const hunkHeaderMatch = rawLine.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/);

    if (hunkHeaderMatch) {
      if (current) hunks.push(current);
      current = {
        header: rawLine,
        context: hunkHeaderMatch[3].trim(),
        lines: [],
      };
      current.oldLine = parseInt(hunkHeaderMatch[1], 10);
      current.newLine = parseInt(hunkHeaderMatch[2], 10);
      continue;
    }

    if (!current) continue; // ignore any preamble before the first hunk

    const marker = rawLine[0];
    const content = rawLine.slice(1);

    if (marker === '+') {
      current.lines.push({ type: 'add', content, newLineNo: current.newLine, oldLineNo: null });
      current.newLine += 1;
    } else if (marker === '-') {
      current.lines.push({ type: 'remove', content, newLineNo: null, oldLineNo: current.oldLine });
      current.oldLine += 1;
    } else {
      current.lines.push({ type: 'context', content, newLineNo: current.newLine, oldLineNo: current.oldLine });
      current.newLine += 1;
      current.oldLine += 1;
    }
  }

  if (current) hunks.push(current);
  return hunks;
}
