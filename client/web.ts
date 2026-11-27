// The selection popup is adapted from paseo-chat-polish by Hieu Le (MIT): https://github.com/lthieu96/paseo-chat-polish
import { Platform } from "react-native";
import { toInlineCode, toQuote } from "./format";

// The plugin compiles without lib.dom (it also loads on iOS and Android), so the DOM it uses is declared here.
type Rect = { top: number; left: number; bottom: number; width: number; height: number };
type El = {
  style: { setProperty(name: string, value: string): void };
  textContent: string | null;
  setAttribute(name: string, value: string): void;
  closest(selector: string): El | null;
  appendChild(child: El): void;
  addEventListener(type: string, listener: (event: Ev) => void): void;
  getBoundingClientRect(): Rect;
  remove(): void;
};
type SelNode = { nodeType: number; parentElement: El | null };
type Selected = {
  isCollapsed: boolean;
  rangeCount: number;
  toString(): string;
  getRangeAt(index: 0): { startContainer: SelNode; endContainer: SelNode; getBoundingClientRect(): Rect };
};
type Ev = {
  target: unknown;
  key?: string;
  shiftKey?: boolean;
  clipboardData?: { setData(type: string, data: string): void };
  preventDefault(): void;
  stopImmediatePropagation(): void;
};
type Doc = {
  head: El;
  body: El;
  createElement(tag: "style" | "div" | "span" | "button"): El;
  getSelection(): Selected | null;
  execCommand(command: "copy"): boolean;
  addEventListener(type: string, listener: (event: Ev) => void, capture?: boolean): void;
  removeEventListener(type: string, listener: (event: Ev) => void, capture?: boolean): void;
};

declare const document: Doc;
declare function getComputedStyle(el: El): { fontFamily: string };
declare function setTimeout(cb: () => void, ms: number): number;
declare const innerWidth: number;

const MENU = "data-copy-selection";
const MENU_CSS = `
[${MENU}] { position: fixed; z-index: 10000; display: flex; flex-direction: column; gap: 1px; padding: 3px; border: 1px solid var(--colors-border); border-radius: 8px; background-color: var(--colors-surface2); box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45); animation: copy-selection-pop 40ms ease-out; }
:root.light [${MENU}] { background-color: var(--colors-surface1); }
[${MENU}] > div { display: flex; align-items: center; gap: 1px; }
[${MENU}] span { min-width: 3.4em; padding: 0 4px 0 7px; color: var(--colors-foreground-muted); font-size: 12px; }
[${MENU}] button { height: 24px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: var(--colors-foreground); font-family: inherit; font-size: 12px; font-weight: 500; white-space: nowrap; cursor: pointer; }
[${MENU}] button:hover { background-color: color-mix(in srgb, var(--colors-surface2), var(--colors-foreground) 12%); }
@keyframes copy-selection-pop { from { opacity: 0; transform: translateY(2px); } }
`;
const REPLY = '[data-testid="assistant-message"]';

/**
 * Selecting text in a reply shows "Copy  Text  Markdown  Code" and "Quote  Add to chat" above it. Markdown is
 * what Ctrl+C already copies (Paseo's copy handler on replies turns the selection into Markdown), so that
 * button runs a normal copy. Text and Code swap in the rendered text, Code as one inline code span. Add to chat
 * hands the selection as a blockquote to `addToChat`, and copies it when that returns false. Returns cleanup.
 */
export function selectionCopyMenu(addToChat: (quote: string) => boolean): () => void {
  if (Platform.OS !== "web" || typeof document === "undefined") return () => {};
  const style = document.createElement("style");
  style.textContent = MENU_CSS;
  document.head.appendChild(style);
  let menu: El | undefined;
  const hide = () => {
    menu?.remove();
    menu = undefined;
  };
  const inMenu = (target: unknown) => !!menu && !!(target as El | null)?.closest?.(`[${MENU}]`);
  // execCommand keeps the copy inside the click's user gesture; the capture listener replaces Paseo's Markdown.
  const copyPlain = (text: string) => {
    const swap = (event: Ev) => {
      event.clipboardData?.setData("text/plain", text);
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    document.addEventListener("copy", swap, true);
    document.execCommand("copy");
    document.removeEventListener("copy", swap, true);
  };
  const el = (node: SelNode) => (node.nodeType === 1 ? (node as unknown as El) : node.parentElement);
  // Above the selection, or below it near the top; hidden once the selection scrolls out of view.
  const place = () => {
    const sel = document.getSelection();
    if (!menu || !sel?.rangeCount) return hide();
    const box = sel.getRangeAt(0).getBoundingClientRect();
    if (box.bottom < 0 || box.height === 0) return hide();
    const { width, height } = menu.getBoundingClientRect();
    const top = box.top - height - 12 < 8 ? box.bottom + 12 : box.top - height - 12;
    const left = Math.min(Math.max(box.left + box.width / 2 - width / 2, 8), innerWidth - width - 8);
    menu.style.setProperty("top", `${Math.round(top)}px`);
    menu.style.setProperty("left", `${Math.round(left)}px`);
  };
  const show = () => {
    hide();
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !sel.toString().trim()) return;
    const range = sel.getRangeAt(0);
    const reply = el(range.startContainer)?.closest(REPLY) ?? el(range.endContainer)?.closest(REPLY);
    if (!reply) return;
    const m = (menu = document.createElement("div"));
    m.setAttribute(MENU, "");
    // The menu sits outside #root, where Paseo sets its UI font.
    m.style.setProperty("font-family", getComputedStyle(reply).fontFamily);
    // Pressing a button would otherwise clear the selection before it copies.
    m.addEventListener("mousedown", (event) => event.preventDefault());
    // Each action returns what its row's label says afterwards.
    const rows: Array<[string, Array<[string, () => string]>]> = [
      [
        "Copy",
        [
          ["Text", () => (copyPlain(sel.toString()), "Copied")],
          ["Markdown", () => (document.execCommand("copy"), "Copied")],
          ["Code", () => (copyPlain(toInlineCode(sel.toString())), "Copied")],
        ],
      ],
      [
        "Quote",
        [
          [
            "Add to chat",
            () => {
              const quote = toQuote(sel.toString());
              if (addToChat(quote)) return "Added";
              copyPlain(quote);
              return "Copied instead";
            },
          ],
        ],
      ],
    ];
    for (const [title, actions] of rows) {
      const row = document.createElement("div");
      const lead = document.createElement("span");
      lead.textContent = title;
      row.appendChild(lead);
      for (const [label, run] of actions) {
        const button = document.createElement("button");
        button.textContent = label;
        button.setAttribute("type", "button");
        button.addEventListener("click", () => {
          lead.textContent = run();
          setTimeout(() => menu === m && hide(), 700);
        });
        row.appendChild(button);
      }
      m.appendChild(row);
    }
    document.body.appendChild(m);
    place();
  };
  const onUp = (event: Ev) => void (inMenu(event.target) || setTimeout(show, 0));
  const onDown = (event: Ev) => void (inMenu(event.target) || hide());
  const onKey = (event: Ev) => void (event.key === "Escape" ? hide() : event.shiftKey && setTimeout(show, 0));
  // Reading the selection forces a style and layout pass, so only while the menu is up.
  const onSelection = () => void (menu && document.getSelection()?.isCollapsed && hide());
  const events: Array<[string, (event: Ev) => void, boolean]> = [
    ["mouseup", onUp, false],
    ["mousedown", onDown, false],
    ["keyup", onKey, false],
    ["selectionchange", onSelection, false],
    ["scroll", place, true],
  ];
  for (const [type, listener, capture] of events) document.addEventListener(type, listener, capture);
  return () => {
    for (const [type, listener, capture] of events) document.removeEventListener(type, listener, capture);
    hide();
    style.remove();
  };
}
