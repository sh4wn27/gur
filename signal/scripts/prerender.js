// Build-time prerender step for growingupwithrobotics.org.
//
// The site is a plain React SPA (UMD React + hand-compiled JSX, no bundler).
// Non-JS clients (crawlers, LLM fetchers) only ever saw the static
// "having trouble loading" fallback that lives in #root until React mounts.
// This script boots the page in headless Chromium, waits for the real React
// render to settle, and bakes the resulting DOM back into index.html so
// crawlers get the actual rendered page. ReactDOM.createRoot() on the client
// re-renders from scratch on load (no hydrateRoot), so baked-in markup is
// always safely replaced for real browsers — this only changes what a
// non-JS fetch sees.
//
// Runs only at Vercel build time (see ../vercel.json); node_modules is
// removed after this runs so none of this ships to production.

const http = require("http");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
// @sparticuz/chromium ships as an ESM module with a default export; under
// require() that lands on .default rather than the module object itself.
const chromium = require("@sparticuz/chromium").default;

const ROOT = path.join(__dirname, "..");
const PORT = 8973;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

function serveStatic() {
  return http
    .createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      const filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
      });
    })
    .listen(PORT);
}

async function main() {
  const server = serveStatic();
  // plain puppeteer's bundled Chromium needs desktop shared libs (e.g. libnspr4.so)
  // that Vercel's build image doesn't have; @sparticuz/chromium is built for
  // exactly this kind of serverless/Lambda-style container.
  const browser = await puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath: await chromium.executablePath(),
    headless: "shell",
  });

  try {
    const page = await browser.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (err) => runtimeErrors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") runtimeErrors.push(msg.text());
    });

    await page.goto(`http://127.0.0.1:${PORT}/index.html`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await page.waitForSelector(".topbar", { timeout: 15000 });

    // The impact stats (7,000+ students, etc.) are IntersectionObserver-triggered
    // count-up animations that only start once their element scrolls into view.
    // Walk the page so every observer fires, then wait out the 1400ms tween.
    await page.evaluate(async () => {
      const height = document.body.scrollHeight;
      const step = Math.max(200, Math.floor(window.innerHeight / 2));
      for (let y = 0; y <= height; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const rootHTML = await page.evaluate(() => document.getElementById("root").innerHTML);
    if (!rootHTML || rootHTML.includes("having trouble loading")) {
      throw new Error(
        "Prerender produced empty/fallback content instead of the real render — aborting so we don't ship a broken page."
      );
    }
    if (!rootHTML.includes("7,000")) {
      throw new Error(
        "Prerender captured the stats section before its count-up animation finished (expected \"7,000\" among the impact numbers) — aborting so we don't ship 0+ stats."
      );
    }
    if (runtimeErrors.length) {
      console.warn(
        "Prerender observed console/runtime errors on the page (continuing anyway):\n" +
          runtimeErrors.join("\n")
      );
    }

    const fullHTML = await page.content();
    fs.writeFileSync(path.join(ROOT, "index.html"), fullHTML);
    console.log(`Prerendered index.html written (${fullHTML.length} bytes).`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
