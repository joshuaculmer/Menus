// Single column, text only.

module.exports = {
  photos: 0,

  render(menu, h) {
    const header = [
      `<header class="menu-header">`,
      `<h1>${h.escape(menu.title)}</h1>`,
      menu.description && `<p class="description">${h.escape(menu.description)}</p>`,
      menu.subDescription && `<p class="sub-description">${h.escape(menu.subDescription)}</p>`,
      `</header>`,
    ];

    const sections = menu.categories.map((category) => [
      `<section class="category">`,
      `<h2>${h.escape(category.name)}</h2>`,
      ...category.items.map((item) => [
        `<div class="item">`,
        `<h3>${h.escape(item.name)}</h3>`,
        item.description && `<p>${h.escape(item.description)}</p>`,
        `</div>`,
      ]),
      `</section>`,
    ]);

    const body = [header, sections].flat(Infinity).filter(Boolean).join("\n");
    return h.page({ title: menu.title, body });
  },
};
