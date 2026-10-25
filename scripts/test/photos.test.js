const test = require("node:test");
const assert = require("node:assert");
const { detectMime, toDataUri } = require("../lib/photos");

const pad = (bytes) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);

test("detects image types from their bytes", () => {
  assert.strictEqual(detectMime(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.strictEqual(detectMime(pad([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.strictEqual(detectMime(pad([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")])), "image/webp");
  assert.strictEqual(detectMime(pad([...Buffer.from("GIF89a")])), "image/gif");
  assert.strictEqual(detectMime(pad([...Buffer.from("not an image")])), null);
  assert.strictEqual(detectMime(Buffer.from([0xff, 0xd8, 0xff])), null);
});

test("builds a data URI", () => {
  assert.strictEqual(toDataUri(Buffer.from("hi"), "image/png"), "data:image/png;base64,aGk=");
});
