import React from "react";

export type ChatMarkdownLiteProps = {
  content: string;
  className?: string;
};

// If the whole table is in a single line (like "| a | b | | 1 | 2 |"),
// convert the `| |` row separators into newlines so our simple parser can read it.
function normalizeCompactTables(src: string) {
  if (!/\n/.test(src) && /\|.*\|\s*\|/.test(src)) {
    return src.replace(/\|\s*\|/g, "|\n|");
  }
  return src;
}

// Check if a line looks like a Markdown table separator row, e.g.:
// "| --- | :---: | ---: |" (colons optional).
function isSeparator(line: string) {
  const cells = line.trim().split("|").map((s) => s.trim()).filter(Boolean);
  if (cells.length === 0) return false;
  return cells.every((c) => /^:?-{3,}:?$/.test(c));
}

// Split a pipe row into cells, trimming whitespace and allowing leading/trailing pipes.
function splitRow(line: string) {
  if (!line.includes("|")) return null;
  const parts = line.split("|");
  if (parts[0].trim() === "") parts.shift();
  if (parts[parts.length - 1].trim() === "") parts.pop();
  return parts.map((s) => s.trim());
}

export default function ChatMarkdownLite({ content, className }: ChatMarkdownLiteProps) {
  const text = normalizeCompactTables(content);
  const lines = text.split(/\r?\n/);
  const out: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect possible table start: a header row followed by a separator row
    const headerCells = splitRow(line);
    const nextLine = lines[i + 1] ?? "";

    if (headerCells && isSeparator(nextLine)) {
      // Collect body rows until hitting a non-table line
      i += 2; // skip header + separator
      const bodyRows: string[][] = [];
      while (i < lines.length) {
        const rowCells = splitRow(lines[i]);
        if (!rowCells) break;
        bodyRows.push(rowCells);
        i++;
      }

      out.push(
        <div key={`tbl-${i}-${out.length}`} className="my-3 w-full overflow-x-auto">
          <table className="min-w-[560px] border-collapse text-sm">
            <thead className="bg-gray-50">
              <tr>
                {headerCells.map((c, idx) => (
                  <th key={idx} className="border px-3 py-2 text-left font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((c, cIdx) => (
                    <td key={cIdx} className="border px-3 py-2 align-top">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Not a table: group consecutive non-empty lines into a paragraph
    if (line.trim() !== "") {
      const buf: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== "") {
        const maybeHead = splitRow(lines[i]);
        const maybeSep = lines[i + 1] ?? "";
        if (maybeHead && isSeparator(maybeSep)) break; // stop before next table
        buf.push(lines[i]);
        i++;
      }
      out.push(
        <p key={`p-${i}-${out.length}`} className="my-2 leading-relaxed">
          {buf.join(" ")}
        </p>
      );
      continue;
    }

    // Blank line spacing
    out.push(<div key={`sp-${i}-${out.length}`} className="h-2" />);
    i++;
  }

  return <div className={className}>{out}</div>;
}
