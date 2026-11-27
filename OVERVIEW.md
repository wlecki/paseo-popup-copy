# Popup copy

Select text in an agent reply and a small popup appears above it with copy options:

- **Text**: the text as shown on screen.
- **Markdown**: the selection with its Markdown formatting (lists, bold, links, code blocks), the same as Ctrl+C or Cmd+C on a reply.
- **Code**: the text on one line, with line breaks turned into spaces, wrapped in an inline code span. If the text has backticks, a longer fence keeps it one span.

A second row, **Quote**, has **Add to chat**. It adds the selection as a Markdown blockquote, followed by an empty line, to the end of the focused agent's prompt and puts the cursor after it. If no agent tab is focused, it copies the quote instead.

Press Escape, click elsewhere, or clear the selection to close the popup.

## Setup

No settings. Works in the desktop and web apps. iOS and Android use the system text selection menu, so the popup does not show there.

## Limits

The popup shows only for agent replies, not for your own prompts or tool output. The plugin reads only the current text selection, and writes only to the clipboard or the focused agent's prompt. It sends nothing over the network.

The popup is based on the one in paseo-chat-polish by Hieu Le (MIT).
