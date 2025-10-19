import React from "react";
import ReactMarkdown from "react-markdown";

/**
 * ChatMarkdownLite (hybrid)
 * Minimal renderer that mixes full Markdown (via ReactMarkdown) with
 * a tiny table parser for GitHub-style tables. No extra packages.
 */
export type ChatMarkdownLiteProps = {
  content: string;
  className?: string;
};

// If a whole table is in a single line (e.g. "| a | b | | 1 | 2 |"),
// convert the `| |` row separators into newlines so our simple parser can read it.
function normalizeCompactTables(src: string) {
  // Only apply when we detect at least 2 rows separated by a bare `|` between them.
  if (!/\n/.test(src) && /\|[^\n]*\|\s*\|[^\n]*\|/.test(src)) {
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

// Break content into blocks: normal markdown vs table blocks
function segmentContent(src: string) {
  const lines = src.split(/\r?\n/);
  const segments = [] as Array<{ type: "md"; text: string } | { type: "table"; header: string[]; rows: string[][] }>;
  let i = 0;
  let mdBuf: string[] = [];

  const flushMd = () => {
    if (mdBuf.length) {
      segments.push({ type: "md", text: mdBuf.join("\n") });
      mdBuf = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const headerCells = splitRow(line);
    const nextLine = lines[i + 1] ?? "";

    if (headerCells && isSeparator(nextLine)) {
      // Table block
      flushMd();
      i += 2; // skip header + separator
      const bodyRows: string[][] = [];
      while (i < lines.length) {
        const rowCells = splitRow(lines[i]);
        if (!rowCells) break;
        bodyRows.push(rowCells);
        i++;
      }
      segments.push({ type: "table", header: headerCells, rows: bodyRows });
      continue;
    }

    // Not a table header: accumulate as markdown
    mdBuf.push(line);
    i++;
  }

  flushMd();
  return segments;
}

export default function ChatMarkdownLite({ content, className }: ChatMarkdownLiteProps) {
  const normalized = normalizeCompactTables(content);
  const segments = segmentContent(normalized);

  return (
    <div className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === "md") {
          // Render normal Markdown so headings/lists/links work
          return (
            <ReactMarkdown
              key={idx}
              components={{
                a: ({ node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" className="markdown-link" />
                ),
              }}
            >
              {seg.text}
            </ReactMarkdown>
          );
        }
        // Render table blocks
        return (
          <div key={idx} className="my-3 w-full overflow-x-auto">
            <table className="min-w-[560px] border-collapse text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {seg.header.map((c, hIdx) => (
                    <th key={hIdx} className="border px-3 py-2 text-left font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seg.rows.map((row, rIdx) => (
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
      })}
    </div>
  );
}
