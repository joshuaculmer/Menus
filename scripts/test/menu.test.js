const test = require("node:test");
const assert = require("node:assert");
const { parseMenu } = require("../lib/menu");

test("parses title, descriptions, categories, and items", () => {
  const { menu, warnings } = parseMenu([
    "# Taco Night",
    "## Mexican favorites",
    "### Served family style",
    "",
    "# Mains",
    "- [Mom's Enchiladas](abc-123)",
    "* [Burrito Bowl]( def-456 )",
  ].join("\r\n"));

  assert.strictEqual(menu.title, "Taco Night");
  assert.strictEqual(menu.description, "Mexican favorites");
  assert.strictEqual(menu.subDescription, "Served family style");
  assert.deepStrictEqual(menu.categories, [{
    name: "Mains",
    items: [
      { name: "Mom's Enchiladas", uuid: "abc-123", line: 6 },
      { name: "Burrito Bowl", uuid: "def-456", line: 7 },
    ],
  }]);
  assert.deepStrictEqual(warnings, []);
});

test("reads photos from front matter, inline or as a list, with file line numbers", () => {
  const { menu, warnings } = parseMenu([
    "---",
    "photos: [aaa, bbb]",
    "photos:",
    "  - ccc",
    "color: red",
    "---",
    "# Title",
  ].join("\n"));

  assert.deepStrictEqual(menu.photos, [
    { uuid: "aaa", line: 2 },
    { uuid: "bbb", line: 2 },
    { uuid: "ccc", line: 4 },
  ]);
  assert.strictEqual(menu.title, "Title");
  assert.deepStrictEqual(warnings, ['line 5: ignored front matter "color: red"']);
});

test("warns on unclosed front matter", () => {
  const { warnings } = parseMenu("---\nphotos: [a]\n# Title");
  assert.strictEqual(warnings[0], 'line 1: front matter has no closing "---"');
});

test("warns on lines it cannot place", () => {
  const { warnings } = parseMenu([
    "# Title",
    "- [Orphan](abc)",
    "# Mains",
    "Link to recipes",
  ].join("\n"));

  assert.deepStrictEqual(warnings, [
    'line 2: ignored "- [Orphan](abc)"',
    'line 4: ignored "Link to recipes"',
  ]);
});
