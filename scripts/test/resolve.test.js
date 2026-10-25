const test = require("node:test");
const assert = require("node:assert");
const { resolveMenu } = require("../lib/resolve");

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(12)]);
const JUNK = Buffer.alloc(16);

const backup = {
  recipes: new Map([
    ["a", { title: "Recipe A", description: "About A" }],
    ["b", { title: "Recipe B", description: "" }],
    ["c", { title: "Recipe C ", description: "About C" }],
    ["junk", { title: "Junk Photo", description: "" }],
  ]),
  readPicture: (recipe) => ({ "Recipe A": JPEG, "Recipe C ": JPEG, "Junk Photo": JUNK })[recipe.title] ?? null,
};

function menuWith(photos, items) {
  return {
    title: "T",
    description: "",
    subDescription: "",
    photos: photos.map((uuid, i) => ({ uuid, line: 2 + i })),
    categories: [{ name: "Mains", items: items.map(([name, uuid], i) => ({ name, uuid, line: 10 + i })) }],
  };
}

test("resolves items, drops unknown uuids, and attaches item photos", () => {
  const { data, errors } = resolveMenu(menuWith([], [["Alpha", "a"], ["Beta", "b"], ["Ghost", "zzz"]]), backup, 0);

  const [alpha, beta] = data.categories[0].items;
  assert.strictEqual(data.categories[0].items.length, 2);
  assert.deepStrictEqual([alpha.name, alpha.description], ["Alpha", "About A"]);
  assert.match(alpha.photo.src, /^data:image\/jpeg;base64,/);
  assert.strictEqual(beta.photo, null);
  assert.deepStrictEqual(errors, ['line 12: no recipe with uuid zzz ("Ghost")']);
});

test("featured photos use the menu name when the recipe is on the menu", () => {
  const { data, errors, warnings } = resolveMenu(menuWith(["a", "c"], [["Alpha", "a"]]), backup, 2);

  assert.deepStrictEqual(data.photos.map((p) => p.alt), ["Alpha", "Recipe C"]);
  assert.deepStrictEqual(errors, []);
  assert.deepStrictEqual(warnings, []);
});

test("warns on absent or unsupported photos and errors when slots go unfilled", () => {
  const { data, errors, warnings } = resolveMenu(menuWith(["a", "b", "junk", "zzz"], []), backup, 4);

  assert.strictEqual(data.photos.length, 1);
  assert.deepStrictEqual(warnings, [
    'line 3: photo for "Recipe B" is not in the backup',
    'line 4: photo for "Junk Photo" is an unsupported image type',
  ]);
  assert.deepStrictEqual(errors, [
    "line 5: no recipe with uuid zzz (photos)",
    "template needs 4 photo(s), menu has 1",
  ]);
});

test("warns and trims when photos outnumber slots", () => {
  const { data, errors, warnings } = resolveMenu(menuWith(["a", "c"], []), backup, 1);

  assert.deepStrictEqual(data.photos.map((p) => p.alt), ["Recipe A"]);
  assert.deepStrictEqual(errors, []);
  assert.deepStrictEqual(warnings, ["2 photo(s) for 1 template slot(s); only the first 1 are used"]);
});
