// Loads a template folder and renders menu data with it.
//
// A template folder holds render.js and style.css. render.js exports either:
//
//   Flowing template, where the browser breaks pages:
//     photos               number of photo slots
//     render(menu, h)      returns the page HTML, usually through h.page()
//
//   Paged template, where each page is drawn explicitly:
//     photos               number of photo slots
//     pages: { min, max }  pages past min print only when text reaches them
//     page(menu, h, n)     returns the HTML for page n (0-based), with h.flow()
//                          where text goes. Ignoring n gives identical pages.
//                          Each page is wrapped in <div class="page page-{n+1}">.
//     blocks(menu, h)      optional. Returns the HTML blocks that flow across
//                          pages. Defaults to defaultBlocks() below.

const fs = require("node:fs");
const path = require("node:path");
const { paginate } = require("./paginate");

function escape(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Header, then each category heading followed by its items.
function defaultBlocks(menu, h) {
  const header = [
    `<header class="menu-header">`,
    `<h1>${h.escape(menu.title)}</h1>`,
    menu.description && `<p class="description">${h.escape(menu.description)}</p>`,
    menu.subDescription && `<p class="sub-description">${h.escape(menu.subDescription)}</p>`,
    `</header>`,
  ].filter(Boolean).join("\n");

  const rest = menu.categories.flatMap((category) => [
    `<h2 class="keep-with-next">${h.escape(category.name)}</h2>`,
    ...category.items.map((item) => [
      `<div class="item">`,
      `<h3>${h.escape(item.name)}</h3>`,
      item.description && `<p>${h.escape(item.description)}</p>`,
      `</div>`,
    ].filter(Boolean).join("\n")),
  ]);

  return [header, ...rest];
}

function validPages(pages) {
  return Number.isInteger(pages?.min) && Number.isInteger(pages?.max)
    && pages.min >= 1 && pages.max >= pages.min;
}

function loadTemplate(dir) {
  const name = path.basename(dir);
  const mod = require(path.join(dir, "render.js"));
  const fail = (msg) => { throw new Error(`Template ${name}: render.js ${msg}`); };

  if (!Number.isInteger(mod.photos) || mod.photos < 0) fail("must export photos as a whole number");
  if (typeof mod.page === "function") {
    if (!validPages(mod.pages)) fail("must export pages as { min, max } with 1 <= min <= max");
  } else if (typeof mod.render !== "function") {
    fail("must export a render or page function");
  }

  return {
    name,
    photos: mod.photos,
    paged: typeof mod.page === "function",
    pages: mod.pages,
    module: mod,
    css: fs.readFileSync(path.join(dir, "style.css"), "utf8"),
  };
}

function helpers(template) {
  return {
    escape,
    css: template.css,
    flow: () => `<div class="flow"></div>`,

    // Wraps body HTML in a standalone page with the template's CSS inlined.
    page: ({ title, body }) => [
      "<!DOCTYPE html>",
      `<html lang="en">`,
      "<head>",
      `<meta charset="utf-8">`,
      `<title>${escape(title)}</title>`,
      `<style>\n${template.css}\n</style>`,
      "</head>",
      "<body>",
      body,
      "</body>",
      "</html>",
      "",
    ].join("\n"),
  };
}

function renderPaged(template, menu, h) {
  const { module: mod, pages } = template;
  const blocks = (mod.blocks ?? defaultBlocks)(menu, h);
  const sheets = Array.from({ length: pages.max }, (_, n) =>
    `<div class="page page-${n + 1}">\n${mod.page(menu, h, n)}\n</div>`);

  const body = [
    ...sheets,
    `<template id="menu-blocks">\n${blocks.join("\n")}\n</template>`,
    `<script type="application/json" id="pagination-result"></script>`,
    `<script>\n${paginate.toString()}\nwindow.addEventListener("load", () => paginate(${pages.min}));\n</script>`,
  ].join("\n");

  return h.page({ title: menu.title, body });
}

function renderTemplate(template, menu) {
  const h = helpers(template);
  return template.paged ? renderPaged(template, menu, h) : template.module.render(menu, h);
}

module.exports = { escape, defaultBlocks, loadTemplate, renderTemplate };
