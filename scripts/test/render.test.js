const test = require("node:test");
const assert = require("node:assert");
const { renderMenu } = require("../lib/render");

const template = { html: "<title>{{title}}</title><style>{{css}}</style>{{body}}", css: "h1{}" };

const menu = {
  title: "Dinner & Dessert",
  description: "",
  subDescription: "",
  categories: [{
    name: "Mains",
    items: [
      { name: "Known", uuid: "a", line: 3 },
      { name: "Missing", uuid: "zzz", line: 4 },
      { name: "No blurb", uuid: "b", line: 5 },
    ],
  }],
};

const recipes = new Map([
  ["a", { description: "Costs $5 <cheap>" }],
  ["b", { description: "" }],
]);

test("renders known items, escapes text, and reports missing uuids", () => {
  const { html, errors } = renderMenu(menu, recipes, template);

  assert.match(html, /<title>Dinner &amp; Dessert<\/title>/);
  assert.match(html, /<style>h1\{\}<\/style>/);
  assert.match(html, /<h3>Known<\/h3>\n<p>Costs \$5 &lt;cheap&gt;<\/p>/);
  assert.match(html, /<h3>No blurb<\/h3>\n<\/div>/);
  assert.doesNotMatch(html, /Missing/);
  assert.deepStrictEqual(errors, ['line 4: no recipe with uuid zzz ("Missing")']);
});
