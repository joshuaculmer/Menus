#!/usr/bin/env node
// Prints "uuid<TAB>title" for every recipe in the newest .rtk backup, sorted by title.
//
// Usage:
//   node scripts/list-recipes.js           list all recipes
//   node scripts/list-recipes.js banana    list recipes whose title contains "banana"

const paths = require("./paths");
const { findNewestBackup, loadRecipes } = require("./lib/recipes");

const filter = (process.argv[2] ?? "").toLowerCase();
const recipes = [...loadRecipes(findNewestBackup(paths.RECIPES)).values()]
  .filter((r) => r.title.toLowerCase().includes(filter))
  .sort((a, b) => a.title.localeCompare(b.title));

for (const r of recipes) console.log(`${r.uuid}\t${r.title.trim()}`);
