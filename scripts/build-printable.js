#!/usr/bin/env node
// Builds printable menus: Inputs/raw_menus/*.md + newest .rtk -> Outputs/html -> Outputs/pdf.
//
// Usage:
//   node scripts/build-printable.js                    build every menu
//   node scripts/build-printable.js example            build only example.md
//   node scripts/build-printable.js --html-only        skip the PDF step
//   node scripts/build-printable.js --template simple  use Inputs/template_menus/simple

const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("node:util");
const paths = require("./paths");
const { findNewestBackup, loadRecipes } = require("./lib/recipes");
const { parseMenu } = require("./lib/menu");
const { loadTemplate, renderMenu } = require("./lib/render");
const { findBrowser, htmlToPdf } = require("./lib/pdf");

function rel(p) {
  return path.relative(paths.ROOT, p);
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "html-only": { type: "boolean", default: false },
      template: { type: "string", default: paths.DEFAULT_TEMPLATE },
    },
  });

  const sources = positionals.length
    ? positionals.map((n) => path.join(paths.RAW_MENUS, `${n.replace(/\.md$/, "")}.md`))
    : fs.readdirSync(paths.RAW_MENUS).filter((f) => f.endsWith(".md")).sort()
        .map((f) => path.join(paths.RAW_MENUS, f));

  const missing = sources.filter((p) => !fs.existsSync(p));
  if (missing.length) throw new Error(`No such menu(s): ${missing.map(rel).join(", ")}`);
  if (!sources.length) throw new Error(`No .md files in ${rel(paths.RAW_MENUS)}`);

  const browser = values["html-only"] ? null : findBrowser();
  if (!values["html-only"] && !browser) {
    throw new Error("No Chrome or Edge found for PDF export. Use --html-only.");
  }

  const backup = findNewestBackup(paths.RECIPES);
  const recipes = loadRecipes(backup);
  const template = loadTemplate(path.join(paths.TEMPLATES, values.template));
  console.log(`recipes   ${rel(backup)} (${recipes.size})`);
  console.log(`template  ${values.template}\n`);

  fs.mkdirSync(paths.HTML_OUT, { recursive: true });
  fs.mkdirSync(paths.PDF_OUT, { recursive: true });

  let errorCount = 0;
  for (const source of sources) {
    const name = path.basename(source, ".md");
    try {
      const { menu, warnings } = parseMenu(fs.readFileSync(source, "utf8"));
      const { html, errors } = renderMenu(menu, recipes, template);
      for (const w of warnings) console.warn(`  WARN   ${name}.md ${w}`);
      for (const e of errors) console.error(`  ERROR  ${name}.md ${e}`);
      errorCount += errors.length;

      const htmlPath = path.join(paths.HTML_OUT, `${name}.html`);
      fs.writeFileSync(htmlPath, html, "utf8");
      console.log(`  html   ${rel(htmlPath)}`);

      if (browser) {
        const pdfPath = path.join(paths.PDF_OUT, `${name}.pdf`);
        htmlToPdf(htmlPath, pdfPath, browser);
        console.log(`  pdf    ${rel(pdfPath)}`);
      }
    } catch (err) {
      errorCount++;
      console.error(`  FAIL   ${name}.md: ${err.message}`);
    }
  }

  console.log(`\n${sources.length} menu(s), ${errorCount} error(s).`);
  return errorCount ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
