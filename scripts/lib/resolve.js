// Turns a parsed menu and a loaded backup into the data a template renders.
//
// Templates get finished data only: recipes looked up, photos embedded, and
// the photo list trimmed to the template's slot count. Problems go to
// errors (exit non-zero) or warnings (informational).

const { detectMime, toDataUri } = require("./photos");

// Returns { src, alt } or { problem } when the picture is absent or unsupported.
function embedPhoto(recipe, alt, readPicture) {
  const bytes = readPicture(recipe);
  if (!bytes) return { problem: "is not in the backup" };
  const mime = detectMime(bytes);
  if (!mime) return { problem: "is an unsupported image type" };
  return { src: toDataUri(bytes, mime), alt };
}

function resolveMenu(menu, backup, slots) {
  const { recipes, readPicture } = backup;
  const errors = [];
  const warnings = [];
  const displayNames = new Map();

  const categories = menu.categories.map((category) => ({
    name: category.name,
    items: category.items.flatMap((item) => {
      const recipe = recipes.get(item.uuid);
      if (!recipe) {
        errors.push(`line ${item.line}: no recipe with uuid ${item.uuid} ("${item.name}")`);
        return [];
      }
      displayNames.set(item.uuid, item.name);

      // Item photos are optional extras, so a missing one is not reported.
      const photo = embedPhoto(recipe, item.name, readPicture);
      return [{
        name: item.name,
        description: recipe.description ?? "",
        photo: photo.src ? photo : null,
      }];
    }),
  }));

  const photos = menu.photos.flatMap((ref) => {
    const recipe = recipes.get(ref.uuid);
    if (!recipe) {
      errors.push(`line ${ref.line}: no recipe with uuid ${ref.uuid} (photos)`);
      return [];
    }
    const alt = displayNames.get(ref.uuid) ?? recipe.title.trim();
    const photo = embedPhoto(recipe, alt, readPicture);
    if (photo.problem) {
      warnings.push(`line ${ref.line}: photo for "${alt}" ${photo.problem}`);
      return [];
    }
    return [photo];
  });

  if (photos.length > slots) {
    warnings.push(`${photos.length} photo(s) for ${slots} template slot(s); only the first ${slots} are used`);
  } else if (photos.length < slots) {
    errors.push(`template needs ${slots} photo(s), menu has ${photos.length}`);
  }

  return {
    data: {
      title: menu.title,
      description: menu.description,
      subDescription: menu.subDescription,
      photos: photos.slice(0, slots),
      categories,
    },
    errors,
    warnings,
  };
}

module.exports = { resolveMenu };
