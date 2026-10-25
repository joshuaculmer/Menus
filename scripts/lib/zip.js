// Minimal zip reader. Supports stored and deflated entries, no zip64, no encryption.

const zlib = require("node:zlib");

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;
const EOCD_MIN_SIZE = 22;
const MAX_COMMENT = 0xffff;

// The end-of-central-directory record sits at the end, after an optional comment.
function findEocd(buf) {
  const stop = Math.max(0, buf.length - EOCD_MIN_SIZE - MAX_COMMENT);
  for (let i = buf.length - EOCD_MIN_SIZE; i >= stop; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  throw new Error("Not a zip file (no end-of-central-directory record)");
}

// Returns a Map of entry name -> { method, compressedSize, size, localOffset }.
function readEntries(buf) {
  const eocd = findEocd(buf);
  const count = buf.readUInt16LE(eocd + 10);
  let pos = buf.readUInt32LE(eocd + 16);

  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(pos) !== CENTRAL_SIG) {
      throw new Error(`Bad central directory entry at byte ${pos}`);
    }
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const name = buf.toString("utf8", pos + 46, pos + 46 + nameLen);

    entries.set(name, {
      method: buf.readUInt16LE(pos + 10),
      compressedSize: buf.readUInt32LE(pos + 20),
      size: buf.readUInt32LE(pos + 24),
      localOffset: buf.readUInt32LE(pos + 42),
    });
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

// Returns the uncompressed bytes of one entry.
function extract(buf, entry) {
  const pos = entry.localOffset;
  if (buf.readUInt32LE(pos) !== LOCAL_SIG) {
    throw new Error(`Bad local file header at byte ${pos}`);
  }

  // Local name and extra lengths can differ from the central directory's.
  const start = pos + 30 + buf.readUInt16LE(pos + 26) + buf.readUInt16LE(pos + 28);
  const data = buf.subarray(start, start + entry.compressedSize);

  if (entry.method === 0) return Buffer.from(data);
  if (entry.method === 8) return zlib.inflateRawSync(data);
  throw new Error(`Unsupported zip compression method ${entry.method}`);
}

module.exports = { readEntries, extract };
