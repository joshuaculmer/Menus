// Detects image types from their bytes and embeds them as data URIs.
// RecetteTek names every picture .png, but most are JPEGs.

const SIGNATURES = [
  { mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/webp", test: (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP" },
  { mime: "image/gif", test: (b) => b.toString("latin1", 0, 4) === "GIF8" },
];

// Returns the MIME type, or null for an unsupported format.
function detectMime(bytes) {
  return SIGNATURES.find((s) => bytes.length >= 12 && s.test(bytes))?.mime ?? null;
}

function toDataUri(bytes, mime) {
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

module.exports = { detectMime, toDataUri };
