import assert from "node:assert/strict";
import { test } from "node:test";
import { appendBlock, toInlineCode, toQuote } from "../client/format.ts";

test("joins lines with single spaces", () => {
  assert.equal(toInlineCode("npm run\n  build \r\n\n--watch"), "`npm run build --watch`");
});

test("trims and skips empty selections", () => {
  assert.equal(toInlineCode("  \n foo \n"), "`foo`");
  assert.equal(toInlineCode(" \n "), "");
});

test("uses a longer fence when the text holds backticks", () => {
  assert.equal(toInlineCode("a `b` c"), "``a `b` c``");
  assert.equal(toInlineCode("x ``y`` z"), "```x ``y`` z```");
});

test("pads a span that starts or ends with a backtick", () => {
  assert.equal(toInlineCode("`code`"), "`` `code` ``");
});

test("quotes each line and ends with an empty line", () => {
  assert.equal(toQuote("selected text"), "> selected text\n\n");
  assert.equal(toQuote("\n  first  \n\nsecond\n\n"), ">   first\n>\n> second\n\n");
  assert.equal(toQuote(" \n "), "");
});

test("appends a block as its own paragraph", () => {
  assert.equal(appendBlock("", "> q\n\n"), "> q\n\n");
  assert.equal(appendBlock("  \n", "> q\n\n"), "> q\n\n");
  assert.equal(appendBlock("hi", "> q\n\n"), "hi\n\n> q\n\n");
  assert.equal(appendBlock("hi\n", "> q\n\n"), "hi\n\n> q\n\n");
  assert.equal(appendBlock("> a\n\n", "> q\n\n"), "> a\n\n> q\n\n");
});
