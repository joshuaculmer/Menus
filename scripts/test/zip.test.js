const test = require("node:test");
const assert = require("node:assert");
const zlib = require("node:zlib");
const zip = require("../lib/zip");

// Builds a zip in memory. Each file is { name, data, deflate }.
function makeZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const { name, data, deflate } of files) {
    const nameBuf = Buffer.from(name, "utf8");
    const body = deflate ? zlib.deflateRawSync(data) : data;
    const method = deflate ? 8 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + body.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, centralBuf, eocd]);
}

test("reads stored and deflated entries", () => {
  const buf = makeZip([
    { name: "plain.txt", data: Buffer.from("hello"), deflate: false },
    { name: "packed.json", data: Buffer.from('{"title":"Béchamel"}'), deflate: true },
  ]);
  const entries = zip.readEntries(buf);

  assert.deepStrictEqual([...entries.keys()], ["plain.txt", "packed.json"]);
  assert.strictEqual(zip.extract(buf, entries.get("plain.txt")).toString(), "hello");
  assert.strictEqual(
    zip.extract(buf, entries.get("packed.json")).toString("utf8"),
    '{"title":"Béchamel"}',
  );
});

test("rejects a non-zip buffer", () => {
  assert.throws(() => zip.readEntries(Buffer.alloc(100)), /Not a zip file/);
});
