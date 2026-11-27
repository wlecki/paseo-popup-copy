import type { PluginClientContext } from "@getpaseo/plugin/client";
import { appendBlock } from "./client/format";
import { selectionCopyMenu } from "./client/web";

export default function contribute(client: PluginClientContext) {
  // The reply's DOM does not say which agent wrote it, so the quote goes to the focused agent tab.
  return selectionCopyMenu((quote) => {
    const [composer] = client.composers({ focused: true });
    if (!composer) return false;
    const prompt = appendBlock(composer.prompt, quote);
    composer.setPrompt(prompt);
    void composer.focus({ selection: { start: prompt.length, end: prompt.length } }).catch(() => {});
    return true;
  });
}
