// Parses a raw menu .md file.
//
//   ---
//   photos: [recipe-uuid, recipe-uuid]
//   ---
//   # Title
//   ## Description
//   ### Sub description (optional)
//   # Category
//   - [Display name](recipe-uuid)
//
// The front-matter block is optional. The first # is the title. Every later # starts a category.

const HEADING_RE = /^(#{1,3})\s+(.*\S)\s*$/;
const ITEM_RE = /^[-*]\s+\[([^\]]+)\]\(\s*([^)\s]+)\s*\)\s*$/;
const FENCE = "---";
const KEY_RE = /^(\w+):\s*(.*)$/;
const INLINE_LIST_RE = /^\[(.*)\]$/;
const LIST_ITEM_RE = /^-\s+(\S+)$/;

// Reads "key: [a, b]" and "key:" followed by "- a" lines. Only "photos" is a known key.
function parseFrontMatter(lines, firstLineNo, menu, warnings) {
  let listKey = null;

  lines.forEach((raw, i) => {
    const line = raw.trim();
    const lineNo = firstLineNo + i;
    if (!line) return;

    const listItem = line.match(LIST_ITEM_RE);
    if (listItem && listKey) {
      menu[listKey].push({ uuid: listItem[1], line: lineNo });
      return;
    }

    const pair = line.match(KEY_RE);
    if (pair && pair[1] === "photos") {
      listKey = "photos";
      const inline = pair[2].match(INLINE_LIST_RE);
      if (inline) {
        for (const uuid of inline[1].split(",").map((s) => s.trim()).filter(Boolean)) {
          menu.photos.push({ uuid, line: lineNo });
        }
        listKey = null;
      }
      return;
    }

    listKey = null;
    warnings.push(`line ${lineNo}: ignored front matter "${line}"`);
  });
}

// Returns { menu, warnings }. Warnings name lines the parser could not place.
function parseMenu(text) {
  const menu = { title: "", description: "", subDescription: "", photos: [], categories: [] };
  const warnings = [];
  let lines = text.split(/\r?\n/);
  let offset = 0;

  if (lines[0].trim() === FENCE) {
    const close = lines.findIndex((l, i) => i > 0 && l.trim() === FENCE);
    if (close === -1) {
      warnings.push(`line 1: front matter has no closing "${FENCE}"`);
    } else {
      parseFrontMatter(lines.slice(1, close), 2, menu, warnings);
      offset = close + 1;
      lines = lines.slice(offset);
    }
  }

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const lineNo = offset + i + 1;

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
