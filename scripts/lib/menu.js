// Parses a raw menu .md file.
//
//   # Title
//   ## Description
//   ### Sub description (optional)
//   # Category
//   - [Display name](recipe-uuid)
//
// The first # is the title. Every later # starts a category.

const HEADING_RE = /^(#{1,3})\s+(.*\S)\s*$/;
const ITEM_RE = /^[-*]\s+\[([^\]]+)\]\(\s*([^)\s]+)\s*\)\s*$/;

// Returns { menu, warnings }. Warnings name lines the parser could not place.
function parseMenu(text) {
  const menu = { title: "", description: "", subDescription: "", categories: [] };
  const warnings = [];

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const lineNo = i + 1;

    const heading = line.match(HEADING_RE);
    if (heading) {
      const [, hashes, content] = heading;
      if (hashes === "#" && !menu.title) menu.title = content;
      else if (hashes === "#") menu.categories.push({ name: content, items: [] });
      else if (hashes === "##") menu.description = content;
      else menu.subDescription = content;
      return;
    }

    const item = line.match(ITEM_RE);
    const category = menu.categories.at(-1);
    if (item && category) {
      category.items.push({ name: item[1].trim(), uuid: item[2], line: lineNo });
      return;
    }

    warnings.push(`line ${lineNo}: ignored "${line}"`);
  });

  return { menu, warnings };
}

module.exports = { parseMenu };
