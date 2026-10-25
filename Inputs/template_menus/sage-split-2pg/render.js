// Two pages after the Lunaview lunch menu. Page 1 has photos 1-4 on the left
// and starts the menu text. Page 2 mirrors it, with photos 5-8 on the right
// and the text continued. Each panel's slots are 1 large on top, 2 and 3 side
// by side, 4 below them.

const SLOTS_PER_PAGE = 4;

function panel(photos, h) {
  const slots = Array.from({ length: SLOTS_PER_PAGE }, (_, i) => {
    const photo = photos[i];
    const img = photo ? `<img src="${photo.src}" alt="${h.escape(photo.alt)}">` : "";
    return `<div class="slot slot-${i + 1}">${img}</div>`;
  });
  return [`<aside class="panel">`, ...slots, `</aside>`].join("\n");
}

module.exports = {
  photos: SLOTS_PER_PAGE * 2,
  pages: { min: 2, max: 2 },

  page(menu, h, n) {
    const photos = menu.photos.slice(n * SLOTS_PER_PAGE, (n + 1) * SLOTS_PER_PAGE);
    return `${panel(photos, h)}\n${h.flow()}`;
  },
};
