// Prints HTML to PDF with an installed Chromium-family browser.

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

function findBrowser() {
  return BROWSER_CANDIDATES.find((p) => fs.existsSync(p)) ?? null;
}

function htmlToPdf(htmlPath, pdfPath, browser) {
  // Chrome will not share a running profile, so each print gets a throwaway one.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "menus-chrome-"));
  try {
    const result = spawnSync(browser, [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--user-data-dir=${profile}`,
      "--no-pdf-header-footer",
      `--print-to-pdf=${path.resolve(pdfPath)}`,
      pathToFileURL(path.resolve(htmlPath)).href,
    ], { encoding: "utf8" });

    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Browser did not produce ${pdfPath}\n${result.stderr ?? ""}`.trim());
    }
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

module.exports = { findBrowser, htmlToPdf };
