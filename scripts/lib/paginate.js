// Browser-side pagination for paged templates. Runs inside the built HTML.
//
// Blocks start in <template id="menu-blocks">. Each fills the current page's
// .flow region until it overflows, then moves to the next page. A block marked
// .keep-with-next moves along with the block after it. Optional pages that end
// up empty are removed. The outcome is written to #pagination-result as JSON.

function paginate(minPages) {
  const flows = [...document.querySelectorAll(".page .flow")];
  const blocks = [...document.getElementById("menu-blocks").content.children];
  const overflows = (flow) => flow.scrollHeight > flow.clientHeight + 1;

  let current = 0;
  for (const block of blocks) {
    flows[current].append(block);
    if (!overflows(flows[current]) || current === flows.length - 1) continue;

    const moving = [block];
    const prev = block.previousElementSibling;
    if (prev?.classList.contains("keep-with-next") && prev.previousElementSibling) moving.unshift(prev);
    current++;
    flows[current].append(...moving);
  }

  // Blocks past the bottom of the last page's text area are cut off.
  const last = flows[current];
  const bottom = last.getBoundingClientRect().bottom - parseFloat(getComputedStyle(last).paddingBottom);
  const cut = [...last.children]
    .filter((b) => b.getBoundingClientRect().bottom > bottom + 1)
    .map((b) => (b.querySelector("h1, h2, h3") ?? b).textContent.trim());

  flows.forEach((flow, i) => {
    if (i >= minPages && !flow.children.length) flow.closest(".page").remove();
  });

  document.getElementById("pagination-result").textContent = JSON.stringify({
    pages: document.querySelectorAll(".page").length,
    cut,
  });
}

module.exports = { paginate };
