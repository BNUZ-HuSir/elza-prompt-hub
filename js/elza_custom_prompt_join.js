import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

const NODE_NAME = "ElzaPromptHub_CustomPromptJoin";
const STATE_PROPERTY = "elza_custom_prompt_join";
const STATE_VERSION = 2;
const DEFAULT_COUNT = 3;
const MIN_COUNT = 1;
const MAX_COUNT = 20;
const DEFAULT_SEPARATOR = ", ";
const DEFAULT_RANDOM_MODE = "随机";
const DEFAULT_SEED = 0;
const UPDATE_WIDGET = "更新";
const TEXT_PREFIX = "text_";
const LABEL_PREFIX = "tag_";

function clampCount(value) {
    const numeric = Number.parseInt(value, 10);
    if (!Number.isFinite(numeric)) return DEFAULT_COUNT;
    return Math.max(MIN_COUNT, Math.min(MAX_COUNT, numeric));
}

function parseJson(value) {
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function defaultItem(index) {
    return {label: `输入 ${index + 1}`, text: ""};
}

function normalizeState(value) {
    const source = value && typeof value === "object" ? value : {};
    const count = clampCount(source.count ?? DEFAULT_COUNT);
    const sourceItems = Array.isArray(source.items) ? source.items : [];
    const items = Array.from({length: count}, (_, index) => {
        const item = sourceItems[index] && typeof sourceItems[index] === "object"
            ? sourceItems[index]
            : {};
        return {
            label: String(item.label || `输入 ${index + 1}`),
            text: item.text == null ? "" : String(item.text),
        };
    });
    const seed = Number.parseInt(source.seed, 10);
    const runtimeSeed = source.runtime_seed == null
        ? null
        : normalizeSeed(source.runtime_seed);
    return {
        version: STATE_VERSION,
        count,
        separator: source.separator == null ? DEFAULT_SEPARATOR : String(source.separator),
        random_mode: ["随机", "固定"].includes(source.random_mode)
            ? source.random_mode
            : DEFAULT_RANDOM_MODE,
        seed: Number.isFinite(seed) ? Math.max(0, seed) : DEFAULT_SEED,
        runtime_seed: runtimeSeed,
        items,
    };
}

function readPropertyState(value) {
    const properties = value?.properties || (value.properties = {});
    return normalizeState(parseJson(properties[STATE_PROPERTY]));
}

function getWidget(node, name) {
    return node.widgets?.find((widget) => widget.name === name);
}

function getLabelWidget(node, index) {
    return getWidget(node, `${LABEL_PREFIX}${index}`);
}

function getTextWidget(node, index) {
    return getWidget(node, `${TEXT_PREFIX}${index}`);
}

function getTextInput(node, index) {
    return node.inputs?.find((input) => input.name === `${TEXT_PREFIX}${index}`);
}

function itemIndex(value, prefix) {
    const name = value?.name;
    if (typeof name !== "string" || !name.startsWith(prefix)) return -1;
    const suffix = name.slice(prefix.length);
    return /^\d+$/.test(suffix) ? Number(suffix) : -1;
}

function allocatedCount(node) {
    let highest = -1;
    for (const widget of node.widgets || []) {
        highest = Math.max(highest, itemIndex(widget, TEXT_PREFIX));
    }
    return highest + 1;
}

function textConfig() {
    return ["STRING", {
        default: "",
        multiline: true,
        dynamicPrompts: false,
    }];
}

function attachWidgetConfig(node, widgetLink) {
    const reference = node.inputs?.find((input) => input.widget)?.widget;
    if (!reference) return widgetLink;
    for (const symbol of Object.getOwnPropertySymbols(reference)) {
        const candidate = reference[symbol];
        if (typeof candidate !== "function") continue;
        try {
            if (Array.isArray(candidate())) widgetLink[symbol] = textConfig;
        } catch {
            // 忽略非输入配置读取器的 symbol。
        }
    }
    return widgetLink;
}

function addTextInput(node, index) {
    const existing = getTextInput(node, index);
    if (existing) {
        existing.widget || (existing.widget = {name: existing.name});
        attachWidgetConfig(node, existing.widget);
        return existing;
    }
    const name = `${TEXT_PREFIX}${index}`;
    return node.addInput(name, "STRING", {
        widget: attachWidgetConfig(node, {name}),
    });
}

function setWidgetValue(widget, value) {
    if (!widget) return;
    widget.value = value;
    if (widget.inputEl) widget.inputEl.value = String(value);
    if (widget.element && "value" in widget.element) widget.element.value = String(value);
}

function normalizeSeed(value) {
    const numeric = Number.parseInt(value, 10);
    if (!Number.isFinite(numeric)) return DEFAULT_SEED;
    return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, numeric));
}

function createRuntimeSeed() {
    // 53 bits are exactly representable by JavaScript Number and fit Python's
    // integer seed without rounding surprises.  crypto is preferred; the
    // Math.random fallback keeps the node usable in restricted webviews.
    try {
        const values = new Uint32Array(2);
        const cryptoApi = globalThis.crypto;
        if (!cryptoApi?.getRandomValues) throw new Error("secure random unavailable");
        cryptoApi.getRandomValues(values);
        const high = values[0] & 0x001fffff;
        return high * 0x100000000 + values[1];
    } catch {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }
}

function markWorkflowChanged(node) {
    node.graph?.setDirtyCanvas?.(true, true);
    app.graph?.setDirtyCanvas?.(true, true);
    clearTimeout(node._elzaCustomJoinChangeTimer);
    node._elzaCustomJoinChangeTimer = setTimeout(() => {
        app.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState?.();
    }, 150);
}

function displayLabel(node, index) {
    const label = String(getLabelWidget(node, index)?.value || `输入 ${index + 1}`).trim()
        || `输入 ${index + 1}`;
    const textWidget = getTextWidget(node, index);
    if (textWidget) textWidget.label = label;
    const input = getTextInput(node, index);
    if (input) input.label = label;
}

function collectState(node, count) {
    const items = [];
    for (let index = 0; index < count; index++) {
        items.push({
            label: String(getLabelWidget(node, index)?.value || `输入 ${index + 1}`),
            text: String(getTextWidget(node, index)?.value ?? ""),
        });
    }
    const seed = Number.parseInt(getWidget(node, "seed")?.value, 10);
    return normalizeState({
        count,
        separator: String(getWidget(node, "separator")?.value ?? DEFAULT_SEPARATOR),
        random_mode: String(getWidget(node, "random_mode")?.value || DEFAULT_RANDOM_MODE),
        seed: Number.isFinite(seed) ? seed : DEFAULT_SEED,
        runtime_seed: node._elzaCustomJoinRuntimeSeed == null
            ? null
            : normalizeSeed(node._elzaCustomJoinRuntimeSeed),
        items,
    });
}

function writeState(node, count) {
    const state = collectState(node, clampCount(count));
    node.properties || (node.properties = {});
    node.properties[STATE_PROPERTY] = JSON.stringify(state);
    return state;
}

function handleValueChanged(node) {
    if (node._elzaCustomJoinApplying) return;
    writeState(node, allocatedCount(node) || DEFAULT_COUNT);
    markWorkflowChanged(node);
}

function handleSeedChanged(node, value) {
    const seedWidget = getWidget(node, "seed");
    const seed = normalizeSeed(value);

    // 随机模式仍显示 seed，但本值由 Queue 前的 beforeQueued 更新；不允许
    // 用户通过数字控件直接改动本次运行 seed。
    if (getWidget(node, "random_mode")?.value !== "固定") {
        setWidgetValue(seedWidget, node._elzaCustomJoinSeedValue ?? DEFAULT_SEED);
        return;
    }

    node._elzaCustomJoinSeedValue = seed;
    setWidgetValue(seedWidget, seed);
    handleValueChanged(node);
}

function prepareQueueSeed(node) {
    if (getWidget(node, "random_mode")?.value !== "随机") return;
    const runtimeSeed = createRuntimeSeed();
    node._elzaCustomJoinRuntimeSeed = runtimeSeed;
    node._elzaCustomJoinSeedValue = runtimeSeed;
    setWidgetValue(getWidget(node, "seed"), runtimeSeed);
    // beforeQueued 在 graphToPrompt 之前执行，属性会随本次 workflow 一起提交。
    writeState(node, allocatedCount(node) || DEFAULT_COUNT);
    node.setDirtyCanvas?.(true, true);
}

function ensureFixedWidgets(node) {
    if (!getWidget(node, UPDATE_WIDGET)) {
        node.addWidget("button", UPDATE_WIDGET, null, () => updateCount(node));
    }
    if (!getWidget(node, "separator")) {
        node.addWidget("text", "separator", DEFAULT_SEPARATOR, () => handleValueChanged(node));
    }
    let modeWidget = getWidget(node, "random_mode");
    if (!modeWidget) {
        modeWidget = node.addWidget(
            "combo",
            "random_mode",
            DEFAULT_RANDOM_MODE,
            () => {
                applySeedMode(node);
                handleValueChanged(node);
            },
            {values: ["随机", "固定"]},
        );
        modeWidget.label = "随机模式";
    }
    // ComfyUI 每次 Queue（以及 batch 的每一轮）都会调用 beforeQueued。
    // 只挂在一个固定 widget 上，确保一次 Queue 只生成一个运行 seed。
    modeWidget.beforeQueued = () => prepareQueueSeed(node);
    if (!getWidget(node, "seed")) {
        node.addWidget(
            "number",
            "seed",
            DEFAULT_SEED,
            (value) => handleSeedChanged(node, value),
            {
                min: 0,
                max: Number.MAX_SAFE_INTEGER,
                // ComfyUI 当前 NumberWidget 使用 step2 作为普通点击/拖动步长。
                // 仅设置 step: 1 会退化为 0.1，导致需要多次点击才 +1。
                step: 1,
                step2: 1,
                precision: 0,
            },
        );
    }
    applySeedMode(node);
}

function applySeedMode(node) {
    const fixed = getWidget(node, "random_mode")?.value === "固定";
    const seedWidget = getWidget(node, "seed");
    if (!seedWidget) return;
    // 不设置 disabled：ComfyUI 的 NumberWidget 在 disabled 时会清空显示值。
    // 只读模式保留 seed 的可见值，同时由 handleSeedChanged 拦截随机模式的修改。
    seedWidget.disabled = false;
    seedWidget.readOnly = !fixed;
    seedWidget.options || (seedWidget.options = {});
    seedWidget.options.read_only = !fixed;
    node._elzaCustomJoinSeedValue = normalizeSeed(seedWidget.value);
    const input = seedWidget.inputEl || seedWidget.element;
    if (input) {
        input.disabled = false;
        input.readOnly = !fixed;
        input.style.opacity = fixed ? "1" : "0.6";
    }
}

function createItemWidgets(node, index, item = defaultItem(index)) {
    const labelName = `${LABEL_PREFIX}${index}`;
    const labelWidget = node.addWidget("text", labelName, item.label, () => {
        displayLabel(node, index);
        handleValueChanged(node);
        node.setDirtyCanvas?.(true, true);
    });
    labelWidget.label = `标签 ${index + 1}`;

    const textName = `${TEXT_PREFIX}${index}`;
    const result = ComfyWidgets.STRING(node, textName, textConfig(), app);
    const textWidget = result.widget;
    textWidget.options || (textWidget.options = {});
    textWidget.options.getMinHeight = () => 68;
    textWidget.options.getMaxHeight = () => 120;
    if (textWidget.element) {
        textWidget.element.rows = 3;
        textWidget.element.placeholder = `输入“${item.label}”的 Prompt，可使用随机语法`;
    }
    const originalCallback = textWidget.callback;
    textWidget.callback = function () {
        const callbackResult = originalCallback?.apply(this, arguments);
        handleValueChanged(node);
        return callbackResult;
    };
    setWidgetValue(textWidget, item.text);
    addTextInput(node, index);
    displayLabel(node, index);
}

function ensureItems(node, count, items = []) {
    for (let index = allocatedCount(node); index < count; index++) {
        createItemWidgets(node, index, items[index] || defaultItem(index));
    }
}

function removeItem(node, index) {
    const inputPosition = node.inputs?.findIndex((input) => input.name === `${TEXT_PREFIX}${index}`) ?? -1;
    if (inputPosition >= 0) node.removeInput(inputPosition);
    const textWidget = getTextWidget(node, index);
    if (textWidget) node.removeWidget(textWidget);
    const labelWidget = getLabelWidget(node, index);
    if (labelWidget) node.removeWidget(labelWidget);
}

function trimItems(node, count) {
    for (let index = allocatedCount(node) - 1; index >= count; index--) {
        removeItem(node, index);
    }
}

function applyConnectionState(node, index) {
    const input = getTextInput(node, index);
    const widget = getTextWidget(node, index);
    if (!widget) return;
    const connected = input?.link != null;
    const element = widget.inputEl || widget.element;
    widget.disabled = connected;
    if (element) {
        element.disabled = connected;
        element.readOnly = connected;
        element.style.opacity = connected ? "0.68" : "1";
    }
}

function fitNode(node) {
    const computed = node.computeSize?.();
    if (!Array.isArray(computed) || computed.length < 2) return;
    const width = Math.max(Number(node.size?.[0]) || 0, Number(computed[0]) || 0, 340);
    node.setSize?.([width, Number(computed[1]) || Number(node.size?.[1]) || 0]);
}

function applyCount(node, requestedCount, {recordChange = false, fit = false} = {}) {
    if (recordChange) app.graph?.beforeChange?.();
    node._elzaCustomJoinApplying = true;
    try {
        const count = clampCount(requestedCount);
        ensureItems(node, count);
        trimItems(node, count);
        setWidgetValue(getWidget(node, "count"), count);
        for (let index = 0; index < count; index++) {
            addTextInput(node, index);
            displayLabel(node, index);
            applyConnectionState(node, index);
        }
        writeState(node, count);
        if (fit) fitNode(node);
        node.setDirtyCanvas?.(true, true);
        return count;
    } finally {
        node._elzaCustomJoinApplying = false;
        if (recordChange) app.graph?.afterChange?.();
    }
}

function applyState(node, value, {fit = false} = {}) {
    const state = normalizeState(value);
    ensureFixedWidgets(node);
    ensureItems(node, state.count, state.items);
    trimItems(node, state.count);
    node._elzaCustomJoinApplying = true;
    try {
        node._elzaCustomJoinRuntimeSeed = state.runtime_seed;
        setWidgetValue(getWidget(node, "separator"), state.separator);
        setWidgetValue(getWidget(node, "random_mode"), state.random_mode);
        setWidgetValue(getWidget(node, "seed"), state.seed);
        applySeedMode(node);
        state.items.forEach((item, index) => {
            setWidgetValue(getLabelWidget(node, index), item.label);
            setWidgetValue(getTextWidget(node, index), item.text);
            displayLabel(node, index);
        });
    } finally {
        node._elzaCustomJoinApplying = false;
    }
    return applyCount(node, state.count, {fit});
}

function updateCount(node) {
    const count = applyCount(node, getWidget(node, "count")?.value, {
        recordChange: true,
        fit: true,
    });
    markWorkflowChanged(node);
    return count;
}

app.registerExtension({
    name: "Elza.PromptHub.CustomPromptJoin",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_NAME) return;

        const originalCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = originalCreated?.apply(this, arguments);
            ensureFixedWidgets(this);
            applyState(this, readPropertyState(this), {fit: true});
            return result;
        };

        const originalConfigured = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
            const state = readPropertyState({properties: info?.properties || {}});
            ensureFixedWidgets(this);
            ensureItems(this, state.count, state.items);
            const result = originalConfigured?.apply(this, arguments);
            applyState(this, state, {fit: true});
            return result;
        };

        const originalConnectionsChange = nodeType.prototype.onConnectionsChange;
        nodeType.prototype.onConnectionsChange = function () {
            const result = originalConnectionsChange?.apply(this, arguments);
            if (app.configuringGraph || !this.graph || this._elzaCustomJoinApplying) return result;
            for (let index = 0; index < allocatedCount(this); index++) {
                applyConnectionState(this, index);
            }
            return result;
        };

        const originalRemoved = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function () {
            clearTimeout(this._elzaCustomJoinChangeTimer);
            return originalRemoved?.apply(this, arguments);
        };
    },
});
