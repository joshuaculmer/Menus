// Loads recipes from a RecetteTek backup (.rtk), which is a zip holding recipes_0.json.

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

// Returns a Map of uuid -> recipe object.
function loadRecipes(rtkPath) {
  const buf = fs.readFileSync(rtkPath);
  const entries = zip.readEntries(buf);

  const recipes = new Map();
  for (const [name, entry] of entries) {
    if (!RECIPE_FILE_RE.test(name)) continue;
    const list = JSON.parse(zip.extract(buf, entry).toString("utf8"));
    for (const recipe of list) recipes.set(recipe.uuid, recipe);
  }
  return recipes;
}

module.exports = { findNewestBackup, loadRecipes };
