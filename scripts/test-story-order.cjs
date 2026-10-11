const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = {};
context.window = context;
vm.runInNewContext(fs.readFileSync(path.join(root, "js/data.js"), "utf8"), context);
const source = fs.readFileSync(path.join(root, "js/main.js"), "utf8");

function checkOrder(episodes, category) {
  const shelf = { getAttribute: () => category, innerHTML: "" };
  const grid = { getAttribute: () => category, innerHTML: "" };
  const filters = ["all", "together", "kids", "short"].map((filter) => ({
    getAttribute: () => filter,
    classList: { add() {}, remove() {} },
    addEventListener(event, callback) { this.click = callback; }
  }));
  const runtime = {
    LLS: { ...context.LLS, episodes, upcoming: [] },
    location: { pathname: "/categories/" + category + ".html" },
    document: {
      getElementById: (id) => id === "category-grid" ? grid : null,
      querySelectorAll: (selector) => selector === "[data-shelf]" ? [shelf] :
        selector === ".filter-btn" ? filters : []
    }
  };
  const original = episodes.map((episode) => episode.id);
  vm.runInNewContext(source, runtime);
  function verify(html) {
    const ids = Array.from(html.matchAll(/stories\/([^"/]+)\.html/g), (match) => match[1]);
    const rendered = ids.map((id) => episodes.find((episode) => episode.id === id));
    for (let index = 1; index < rendered.length; index += 1) {
      const previous = Date.parse(rendered[index - 1].uploadDate);
      const current = Date.parse(rendered[index].uploadDate);
      assert.ok((Number.isFinite(previous) ? previous : -Infinity) >=
        (Number.isFinite(current) ? current : -Infinity), category + " is not newest-first");
    }
    return ids;
  }
  const shelfIds = verify(shelf.innerHTML);
  for (const filter of filters) {
    filter.click();
    verify(grid.innerHTML);
  }
  assert.deepEqual(episodes.map((episode) => episode.id), original, "Catalog must not be mutated");
  return shelfIds;
}

for (const category of ["all", ...context.LLS.categories.map((item) => item.id)]) {
  assert.ok(checkOrder(context.LLS.episodes, category).length > 0);
}
const template = context.LLS.episodes[0];
const fixtures = [
  { ...template, id: "undated", uploadDate: undefined },
  { ...template, id: "older", uploadDate: "2026-09-01T11:00:00Z" },
  { ...template, id: "invalid", uploadDate: "not-a-date" },
  { ...template, id: "latest", uploadDate: "2026-10-01T11:00:00Z" },
  { ...template, id: "same-date", uploadDate: "2026-10-01T11:00:00Z" }
];
assert.deepEqual(checkOrder(fixtures, "all"), ["latest", "same-date", "older", "undated", "invalid"]);
console.log("PASS: Homepage shelves, all categories, filters, and missing/equal dates are newest-first.");