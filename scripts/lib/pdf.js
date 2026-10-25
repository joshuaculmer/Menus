// Drives an installed Chromium-family browser to print PDFs and read rendered pages.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { spawnSync } = require("node:child_process");

const BROWSER_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

const RESULT_RE = /<script type="application\/json" id="pagination-result">([^<]*)<\/script>/;

function findBrowser() {
  return BROWSER_CANDIDATES.find((p) => fs.existsSync(p)) ?? null;
}

// Runs headless with a throwaway profile, since Chrome will not share a running one.
function runHeadless(browser, args, htmlPath) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "menus-chrome-"));
  try {
    return spawnSync(browser, [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--user-data-dir=${profile}`,
      ...args,
      pathToFileURL(path.resolve(htmlPath)).href,
    ], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

function htmlToPdf(htmlPath, pdfPath, browser) {
  const result = runHeadless(browser, ["--no-pdf-header-footer", `--print-to-pdf=${path.resolve(pdfPath)}`], htmlPath);
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Browser did not produce ${pdfPath}\n${result.stderr ?? ""}`.trim());
  }
}

// Returns { pages, cut } from a paged template's pagination script.
function readPagination(htmlPath, browser) {
  const result = runHeadless(browser, ["--dump-dom"], htmlPath);
  const match = result.stdout?.match(RESULT_RE);
  if (!match) throw new Error(`Could not read pagination result for ${htmlPath}`);
  return JSON.parse(match[1]);
}

module.exports = { findBrowser, htmlToPdf, readPagination };
