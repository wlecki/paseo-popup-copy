/**
 * The selection as one Markdown code span: line breaks become single spaces, and the fence is one
 * backtick longer than the longest backtick run inside, so a selection holding backticks stays one span.
 */
export function toInlineCode(text: string): string {
  const flat = text.replace(/[ \t]*(?:\r\n|\r|\n)+[ \t]*/g, " ").trim();
  if (!flat) return "";
  const longest = Math.max(0, ...(flat.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longest + 1);
  // CommonMark strips one space on each side, so a span that starts or ends with a backtick needs them.
  const pad = flat.startsWith("`") || flat.endsWith("`") ? " " : "";
  return `${fence}${pad}${flat}${pad}${fence}`;
}

/** The selection as a Markdown blockquote followed by an empty line, ready for the reply to go under it. */
export function toQuote(text: string): string {
  const body = text.replace(/^\s*\n|\s+$/g, "");
  if (!body.trim()) return "";
  const lines = body.split(/\r\n|\r|\n/).map((line) => (line.trim() ? `> ${line.trimEnd()}` : ">"));
  return `${lines.join("\n")}\n\n`;
}

/** `prompt` with `block` added at the end, on its own paragraph. */
export function appendBlock(prompt: string, block: string): string {
  if (!prompt.trim()) return block;
  const gap = prompt.endsWith("\n\n") ? "" : prompt.endsWith("\n") ? "\n" : "\n\n";
  return prompt + gap + block;
}
