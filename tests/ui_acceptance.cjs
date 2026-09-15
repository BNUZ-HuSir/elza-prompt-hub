const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(
  "C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);

const BASE_URL = process.env.COMFYUI_URL || "http://127.0.0.1:8188";
const ARTIFACT_DIR = path.join(__dirname, "artifacts");

async function inspectSwitch(page) {
  return page.evaluate(async () => {
    const { app } = await import("/scripts/app.js");
    const node = app.graph._nodes.find(
      (candidate) => candidate.comfyClass === "ElzaPromptHub_PromptSwitch",
    );
    if (!node) throw new Error("Elza Prompt Switch node was not found");

    const serialized = node.serialize();
    return {
      id: node.id,
      type: node.type,
      comfyClass: node.comfyClass,
      title: node.title,
      size: [...node.size],
      inputs: (node.inputs || []).map((input, index) => ({
        index,
        name: input.name,
        type: input.type,
        link: input.link,
        widgetName: input.widget?.name ?? null,
      })),
      widgets: (node.widgets || []).map((widget, index) => {
        const element = widget.element || widget.inputEl;
        const rect = element?.getBoundingClientRect?.();
        return {
          index,
          name: widget.name,
          type: widget.type,
          value: widget.value,
          hidden: Boolean(widget.hidden || widget.options?.hidden),
          disabled: Boolean(element?.disabled),
          readOnly: Boolean(element?.readOnly),
          elementTag: element?.tagName ?? null,
          rect: rect
            ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            : null,
        };
      }),
      widgetsValues: serialized.widgets_values,
      state: JSON.parse(node.properties.elza_prompt_switch),
    };
  });
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const consoleMessages = [];
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleMessages.push(`pageerror: ${error.message}`));

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForFunction(
    () => window.LiteGraph && window.LiteGraph.registered_node_types,
    null,
    { timeout: 60_000 },
  );
  await page.evaluate(async () => {
    window.__elzaAcceptanceApp = (await import("/scripts/app.js")).app;
  });
  await page.waitForFunction(
    () => Boolean(window.__elzaAcceptanceApp?.graph && window.__elzaAcceptanceApp?.canvas),
    null,
    { timeout: 60_000 },
  );
  await page.waitForFunction(
    () => Boolean(window.LiteGraph.registered_node_types.ElzaPromptHub_PromptSwitch),
    null,
    { timeout: 60_000 },
  );

  const appShape = await page.evaluate(async () => {
    const { app } = await import("/scripts/app.js");
    return {
      keys: Object.keys(app),
      hasGraph: Boolean(app.graph),
      hasCanvas: Boolean(app.canvas),
      hasCanvasGraph: Boolean(app.canvas?.graph),
      hasWindowApp: Boolean(window.app),
    };
  });
  console.error(`APP_SHAPE ${JSON.stringify(appShape)}`);

  const setup = await page.evaluate(async () => {
    const { app } = await import("/scripts/app.js");
    const graph = app.graph || app.canvas?.graph;
    const matches = Object.keys(window.LiteGraph.registered_node_types).filter((name) =>
      name.includes("ElzaPromptHub"),
    );
    graph.clear();
    const node = window.LiteGraph.createNode("ElzaPromptHub_PromptSwitch");
    if (!node) throw new Error(`Node type unavailable; found: ${matches.join(", ")}`);
    node.pos = [420, 180];
    graph.add(node);
    app.canvas.centerOnNode(node);
    graph.setDirtyCanvas(true, true);
    return { matches };
  });
  await page.waitForTimeout(800);

  const initial = await inspectSwitch(page);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "prompt-switch-default.png"),
    fullPage: true,
  });

  await page.evaluate(async () => {
    const { app } = await import("/scripts/app.js");
    const node = app.graph._nodes.find(
      (candidate) => candidate.comfyClass === "ElzaPromptHub_PromptSwitch",
    );
    const count = node.widgets.find((widget) => widget.name === "count");
    const update = node.widgets.find((widget) => widget.name === "更新");
    count.value = 5;
    update.callback();
    ["alpha", "beta", "gamma", "delta", "epsilon"].forEach((value, index) => {
      const widget = node.widgets.find((candidate) => candidate.name === `prompt_${index}`);
      widget.value = value;
      widget.callback?.(value);
    });
    app.canvas.centerOnNode(node);
    app.graph.setDirtyCanvas(true, true);
  });
  await page.waitForTimeout(500);
  const expanded = await inspectSwitch(page);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "prompt-switch-count-5.png"),
    fullPage: true,
  });

  const connection = await page.evaluate(async () => {
    const { app } = await import("/scripts/app.js");
    const target = app.graph._nodes.find(
      (candidate) => candidate.comfyClass === "ElzaPromptHub_PromptSwitch",
    );
    const source = window.LiteGraph.createNode("ElzaPromptHub_PromptBank");
    source.pos = [80, 180];
    app.graph.add(source);
    const inputIndex = target.inputs.findIndex((input) => input.name === "prompt_1");
    source.connect(0, target, inputIndex);
    app.graph.setDirtyCanvas(true, true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const widget = target.widgets.find((candidate) => candidate.name === "prompt_1");
    const element = widget.element || widget.inputEl;
    const connected = {
      link: target.inputs[inputIndex].link,
      disabled: Boolean(element?.disabled),
      readOnly: Boolean(element?.readOnly),
    };
    source.disconnectOutput(0);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      connected,
      disconnected: {
        link: target.inputs[inputIndex].link,
        disabled: Boolean(element?.disabled),
        readOnly: Boolean(element?.readOnly),
      },
    };
  });

  const restored = await page.evaluate(async () => {
    const { app } = await import("/scripts/app.js");
    const workflow = app.graph.serialize();
    app.graph.clear();
    app.graph.configure(workflow);
    app.canvas.centerOnNode(
      app.graph._nodes.find(
        (candidate) => candidate.comfyClass === "ElzaPromptHub_PromptSwitch",
      ),
    );
    app.graph.setDirtyCanvas(true, true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const node = app.graph._nodes.find(
      (candidate) => candidate.comfyClass === "ElzaPromptHub_PromptSwitch",
    );
    return {
      values: node.widgets
        .filter((widget) => /^prompt_\d+$/.test(widget.name))
        .map((widget) => widget.value),
      widgetsValues: node.serialize().widgets_values,
      state: JSON.parse(node.properties.elza_prompt_switch),
    };
  });
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "prompt-switch-restored.png"),
    fullPage: true,
  });

  const result = { setup, initial, expanded, connection, restored, consoleMessages };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
