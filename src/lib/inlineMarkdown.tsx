import { Fragment, type ReactNode } from "react";

/**
 * Render the small slice of markdown the AI analysis emits — **bold**,
 * *italic* / _italic_, and `code` — as real React nodes instead of literal
 * asterisks.
 *
 * Streaming-safe: an unmatched marker (e.g. a trailing "**" whose closer hasn't
 * arrived yet) is left as plain text, so partial text never flashes a stray tag.
 * Line breaks in the source become real <br/>s.
 */

// Ordered by precedence: bold (** or __) before italic (* or _) so "**x**"
// isn't mis-read as italic. Each pattern requires a non-empty body.
const RULES: { re: RegExp; render: (inner: string, key: string) => ReactNode }[] = [
  {
    re: /\*\*([^*]+?)\*\*/,
    render: (inner, key) => <strong key={key}>{renderInline(inner, key)}</strong>,
  },
  {
    re: /__([^_]+?)__/,
    render: (inner, key) => <strong key={key}>{renderInline(inner, key)}</strong>,
  },
  {
    re: /\*([^*\n]+?)\*/,
    render: (inner, key) => <em key={key}>{renderInline(inner, key)}</em>,
  },
  {
    re: /_([^_\n]+?)_/,
    render: (inner, key) => <em key={key}>{renderInline(inner, key)}</em>,
  },
  {
    re: /`([^`\n]+?)`/,
    render: (inner, key) => (
      <code key={key} className="deckai-inline-code">
        {inner}
      </code>
    ),
  },
];

/** Recursively parse inline emphasis within a single line of text. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Find the earliest match across all rules.
  let best: { index: number; length: number; inner: string; render: (i: string, k: string) => ReactNode } | null = null;
  for (const { re, render } of RULES) {
    const m = re.exec(text);
    if (m && (best === null || m.index < best.index)) {
      best = { index: m.index, length: m[0].length, inner: m[1], render };
    }
  }

  if (!best) return [text];

  const before = text.slice(0, best.index);
  const after = text.slice(best.index + best.length);
  return [
    before,
    best.render(best.inner, `${keyPrefix}-m`),
    ...renderInline(after, `${keyPrefix}-a`),
  ];
}

/** Render multi-line markdown text, turning newlines into <br/>. */
export function renderInlineMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {renderInline(line, `l${i}`)}
    </Fragment>
  ));
}
