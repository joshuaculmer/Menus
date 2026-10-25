// Loads a RecetteTek backup (.rtk): a zip holding recipes_N.json files and recipe pictures.

const fs = require("node:fs");
const path = require("node:path");
const zip = require("./zip");

const BACKUP_DATE_RE = /_(\d{4}-\d{2}-\d{2})\.rtk$/;
const RECIPE_FILE_RE = /^recipes_\d+\.json$/;

// Picks the backup with the newest date in its filename. Undated .rtk files are skipped.
function findNewestBackup(dir) {
  const dated = fs.readdirSync(dir)
    .map((name) => ({ name, match: name.match(BACKUP_DATE_RE) }))
    .filter((f) => f.match)
    .sort((a, b) => b.match[1].localeCompare(a.match[1]));

  if (dated.length === 0) {
    throw new Error(`No dated .rtk backup (name_YYYY-MM-DD.rtk) in ${dir}`);
  }
  return path.join(dir, dated[0].name);
}

// Returns { recipes, readPicture }.
// recipes maps uuid -> recipe. readPicture(recipe) returns the bytes of the
// recipe's first picture, or null when the backup does not include it.
function loadBackup(rtkPath) {
  const buf = fs.readFileSync(rtkPath);
  const entries = zip.readEntries(buf);

  const recipes = new Map();
  for (const [name, entry] of entries) {
    if (!RECIPE_FILE_RE.test(name)) continue;
    const list = JSON.parse(zip.extract(buf, entry).toString("utf8"));
    for (const recipe of list) recipes.set(recipe.uuid, recipe);
  }

  // Recipes store the picture's path on the phone. The backup keeps only the file name.
  function readPicture(recipe) {
    const picture = recipe.pictures?.[0];
    const entry = picture && entries.get(path.posix.basename(picture));
    return entry ? zip.extract(buf, entry) : null;
  }

  return { recipes, readPicture };
}

module.exports = { findNewestBackup, loadBackup };
