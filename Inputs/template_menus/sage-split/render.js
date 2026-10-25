// Two columns after the Lunaview lunch menu. Every page is identical: the
// same four photos on the left, menu text on the right. Photo slots are
// 1 large on top, 2 and 3 side by side, 4 below them.

const SLOTS = 4;

function panel(photos, h) {
  const slots = Array.from({ length: SLOTS }, (_, i) => {
    const photo = photos[i];
    const img = photo ? `<img src="${photo.src}" alt="${h.escape(photo.alt)}">` : "";
    return `<div class="slot slot-${i + 1}">${img}</div>`;
  });
  return [`<aside class="panel">`, ...slots, `</aside>`].join("\n");
}

module.exports = {
  photos: SLOTS,
  pages: { min: 1, max: 2 },

  page(menu, h) {
    return `${panel(menu.photos, h)}\n${h.flow()}`;
  },
};
