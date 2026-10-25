const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const INPUTS = path.join(ROOT, "Inputs");
const OUTPUTS = path.join(ROOT, "Outputs");

module.exports = {
  ROOT,
  RAW_MENUS: path.join(INPUTS, "raw_menus"),
  TEMPLATES: path.join(INPUTS, "template_menus"),
  RECIPES: path.join(INPUTS, "recipes"),
  HTML_OUT: path.join(OUTPUTS, "html"),
  PDF_OUT: path.join(OUTPUTS, "pdf"),
  DEFAULT_TEMPLATE: "simple",
};
