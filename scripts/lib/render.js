// Renders a parsed menu into a standalone HTML page using a template folder.
//
// A template folder holds template.html and style.css. template.html uses
// {{title}}, {{css}}, and {{body}}. The CSS sets the page size with @page.

const fs = require("node:fs");
const path = require("node:path");

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadTemplate(dir) {
  return {
    html: fs.readFileSync(path.join(dir, "template.html"), "utf8"),
    css: fs.readFileSync(path.join(dir, "style.css"), "utf8"),
  };
}

// Returns { html, errors }. Items whose uuid is not in recipes are left out and reported.
function renderMenu(menu, recipes, template) {
  const errors = [];
  const parts = [`<header class="menu-header">`, `<h1>${escapeHtml(menu.title)}</h1>`];
  if (menu.description) parts.push(`<p class="description">${escapeHtml(menu.description)}</p>`);
  if (menu.subDescription) parts.push(`<p class="sub-description">${escapeHtml(menu.subDescription)}</p>`);
  parts.push(`</header>`);

  for (const category of menu.categories) {
    parts.push(`<section class="category">`, `<h2>${escapeHtml(category.name)}</h2>`);

    for (const item of category.items) {
      const recipe = recipes.get(item.uuid);
      if (!recipe) {
        errors.push(`line ${item.line}: no recipe with uuid ${item.uuid} ("${item.name}")`);
        continue;
      }
      parts.push(`<div class="item">`, `<h3>${escapeHtml(item.name)}</h3>`);
      if (recipe.description) parts.push(`<p>${escapeHtml(recipe.description)}</p>`);
      parts.push(`</div>`);
    }

    parts.push(`</section>`);
  }

  // Function replacers stop "$" in content from being read as a replace pattern.
  const html = template.html
    .replace("{{title}}", () => escapeHtml(menu.title))
    .replace("{{css}}", () => template.css)
    .replace("{{body}}", () => parts.join("\n"));

  return { html, errors };
}

module.exports = { escapeHtml, loadTemplate, renderMenu };
