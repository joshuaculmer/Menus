const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { findNewestBackup } = require("../lib/recipes");

function dirWith(names) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "menus-test-"));
  for (const n of names) fs.writeFileSync(path.join(dir, n), "");
  return dir;
}

test("picks the newest dated backup and skips undated ones", () => {
  const dir = dirWith([
    "backup_myrecipebox_2026-09-01.rtk",
    "backup_myrecipebox_2026-10-25.rtk",
    "backup.rtk",
    "notes.txt",
  ]);
  assert.strictEqual(path.basename(findNewestBackup(dir)), "backup_myrecipebox_2026-10-25.rtk");
});

test("fails when no dated backup exists", () => {
  assert.throws(() => findNewestBackup(dirWith(["backup.rtk"])), /No dated .rtk backup/);
});
