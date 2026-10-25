const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const paths = require("../paths");
const { loadTemplate, renderTemplate } = require("../lib/template");

const menu = {
  title: "Dinner & Dessert",
  description: "",
  subDescription: "",
  photos: [{ src: "data:image/jpeg;base64,AAAA", alt: "A <b>" }],
  categories: [{
    name: "Mains",
    items: [
      { name: "Known", description: "Costs $5 <cheap>", photo: null },
      { name: "No blurb", description: "", photo: null },
    ],
  }],
};

function templateDir(renderJs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "menus-template-"));
  fs.writeFileSync(path.join(dir, "render.js"), renderJs);
  fs.writeFileSync(path.join(dir, "style.css"), "h1{}");
  return dir;
}

test("simple renders escaped text with inlined CSS", () => {
  const html = renderTemplate(loadTemplate(path.join(paths.TEMPLATES, "simple")), menu);

  assert.match(html, /<title>Dinner &amp; Dessert<\/title>/);
  assert.match(html, /<style>\n@page/);
  assert.match(html, /<h3>Known<\/h3>\n<p>Costs \$5 &lt;cheap&gt;<\/p>/);
  assert.match(html, /<h3>No blurb<\/h3>\n<\/div>/);
});

test("sage-split fills photo slots and leaves the rest empty", () => {
  const html = renderTemplate(loadTemplate(path.join(paths.TEMPLATES, "sage-split")), menu);

  assert.match(html, /<div class="slot slot-1"><img src="data:image\/jpeg;base64,AAAA" alt="A &lt;b&gt;"><\/div>/);
  assert.match(html, /<div class="slot slot-4"><\/div>/);
});

test("sage-split-2pg puts photos 5-8 on page 2", () => {
  const eight = Array.from({ length: 8 }, (_, i) => ({ src: `data:image/jpeg;base64,P${i + 1}`, alt: `p${i + 1}` }));
  const html = renderTemplate(loadTemplate(path.join(paths.TEMPLATES, "sage-split-2pg")), { ...menu, photos: eight });
  const [, page1, page2] = html.split(/<div class="page page-\d">/);

  assert.match(page1, /P1[\s\S]*P4/);
  assert.doesNotMatch(page1, /P5/);
  assert.match(page2, /P5[\s\S]*P8/);
});

test("paged templates get one wrapper per page, flowing blocks, and the pagination script", () => {
  const dir = templateDir(`module.exports = {
    photos: 0,
    pages: { min: 1, max: 3 },
    page: (menu, h, n) => "<i>" + n + "</i>" + h.flow(),
  };`);
  const html = renderTemplate(loadTemplate(dir), menu);

  assert.strictEqual(html.match(/<div class="page page-\d">/g).length, 3);
  assert.match(html, /<div class="page page-3">\n<i>2<\/i><div class="flow"><\/div>/);
  assert.match(html, /<template id="menu-blocks">[\s\S]*<h2 class="keep-with-next">Mains<\/h2>/);
  assert.match(html, /paginate\(1\)/);
});

test("rejects a template without a photo count", () => {
  const dir = templateDir("module.exports = { render: () => '' };");
  assert.throws(() => loadTemplate(dir), /must export photos/);
});

test("rejects a paged template with bad page bounds", () => {
  const dir = templateDir("module.exports = { photos: 0, pages: { min: 2, max: 1 }, page: () => '' };");
  assert.throws(() => loadTemplate(dir), /must export pages/);
});
