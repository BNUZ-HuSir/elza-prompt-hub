const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require(
  "C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);

const reviewPath = path.resolve(
  __dirname,
  "../docs/reviews/prompt-bank-mix-ui-review.html",
);
const outputDir = path.dirname(reviewPath);

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(pathToFileURL(reviewPath).href, { waitUntil: "load" });
  await page.screenshot({
    path: path.join(outputDir, "prompt-bank-ui-review.png"),
    fullPage: true,
  });

  await page.click('[data-scene="mix"]');
  await page.click('#nextMix');
  await page.screenshot({
    path: path.join(outputDir, "prompt-mix-ui-review.png"),
    fullPage: true,
  });

  const result = await page.evaluate((capturedErrors) => ({
    title: document.title,
    activeScene: document.querySelector(".scene.active")?.id,
    bankTagCount: document.querySelectorAll("#bankTags .tag-card").length,
    bankSelectedCount: document.querySelectorAll("#bankSelected .selected-item").length,
    mixGroupCount: document.querySelectorAll("#mixGroups .group-card").length,
    mixCandidateCount: document.querySelectorAll("#mixCandidates .candidate").length,
    mixPreview: document.querySelector("#mixPreview")?.textContent,
    errors: capturedErrors,
  }), errors);
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
