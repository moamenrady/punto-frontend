import React from "react";

// ── Lightweight Markdown renderer ───────────────────────────────────────────
// No external dependency: parses the small subset of Markdown that AI
// "solution steps" responses actually use — headers, bold/italic/inline
// code, fenced code blocks, ordered/unordered lists, and paragraphs.
// Raw text is escaped before any formatting is applied, so arbitrary AI
// output can never inject real HTML.

const escapeHtml = (str = "") =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Applies inline formatting (bold, italic, inline code) to already-escaped text. */
function renderInline(text, keyPrefix) {
  // Split on the three inline patterns while keeping the delimiters via capture groups.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} style={{ background: "#F3F4F6", color: "#DB2777", padding: "1px 5px", borderRadius: 4, fontSize: "0.85em" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/** Renders a markdown string as an array of React block elements. */
function renderMarkdown(raw = "") {
  const text = escapeHtml(String(raw ?? "").replace(/\r\n/g, "\n"));
  const lines = text.split("\n");
  const blocks = [];

  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line.trim())) {
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre key={key++} style={{ background: "#111827", color: "#E5E7EB", padding: "12px 14px", borderRadius: 10, overflowX: "auto", fontSize: "0.82rem", margin: "10px 0" }}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const sizes = { 1: "1.15rem", 2: "1.05rem", 3: "0.95rem", 4: "0.9rem" };
      blocks.push(
        <p key={key++} style={{ fontWeight: 800, fontSize: sizes[level] ?? "0.95rem", color: "#111827", margin: "14px 0 6px" }}>
          {renderInline(headerMatch[2], `h${key}`)}
        </p>
      );
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+[.)]\s+/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} style={{ margin: "6px 0 12px", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 5 }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.6 }}>
              {renderInline(item, `ol${key}-${idx}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} style={{ margin: "6px 0 12px", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 5 }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.6 }}>
              {renderInline(item, `ul${key}-${idx}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Paragraph — collect consecutive plain lines
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^```/.test(lines[i].trim()) &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\d+[.)]\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.65, margin: "0 0 10px", whiteSpace: "pre-wrap" }}>
        {renderInline(paraLines.join("\n"), `p${key}`)}
      </p>
    );
  }

  return blocks;
}

/** <Markdown text="..." /> — convenience component wrapping renderMarkdown. */
const Markdown = ({ text }) => <div>{renderMarkdown(text)}</div>;

export default Markdown;
