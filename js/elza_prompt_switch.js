import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

const NODE_NAME = "ElzaPromptHub_PromptSwitch";
const STATE_PROPERTY = "elza_prompt_switch";
const LEGACY_PROPERTY = "elza_prompts";
const STATE_VERSION = 2;
const DEFAULT_COUNT = 3;
const MIN_COUNT = 1;
const MAX_COUNT = 99;
const INPUT_PREFIX = "prompt_";
const UPDATE_WIDGET_NAME = "更新";

function clampCount(value) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return DEFAULT_COUNT;
    return Math.max(MIN_COUNT, Math.min(MAX_COUNT, number));
}

function normalizePrompts(values, count) {
    const prompts = Array.isArray(values)
        ? values.map((value) => value == null ? "" : String(value))
        : [];
    const normalizedCount = clampCount(count ?? (prompts.length || DEFAULT_COUNT));
    if (prompts.length > normalizedCount) prompts.length = normalizedCount;
    while (prompts.length < normalizedCount) prompts.push("");
    return prompts;
}

function parseJson(value) {
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function makeState(count, prompts) {
    const activeCount = clampCount(count);
    const allocated = Math.max(activeCount, Math.min(MAX_COUNT, prompts?.length || 0));
    return {
        count: activeCount,
        prompts: normalizePrompts(prompts, allocated),
    };
}

function readPropertyState(node) {
    const properties = node.properties || (node.properties = {});
    const current = parseJson(properties[STATE_PROPERTY]);
    if (current && typeof current === "object" && Array.isArray(current.prompts)) {
        const count = clampCount(current.count ?? current.prompts.length);
        const allocated = Math.max(count, Number(current.allocated) || 0, current.prompts.length);
        return makeState(count, normalizePrompts(current.prompts, allocated));
    }

    const legacy = parseJson(properties[LEGACY_PROPERTY]);
    if (Array.isArray(legacy)) {
        return makeState(legacy.length || DEFAULT_COUNT, legacy);
    }
    return null;
}

function readLegacyWidgets(info) {
    const values = info?.widgets_values;
    if (!Array.isArray(values) || values.length < 2) return null;
    const count = Number(values[1]);
    if (!Number.isInteger(count) || count < MIN_COUNT || count > MAX_COUNT) return null;
    const promptStart = values.length >= count + 3 && values[2] == null ? 3 : 2;
    return makeState(count, values.slice(promptStart, promptStart + count));
}

function promptIndex(value) {
    const name = value?.name;
    if (typeof name !== "string" || !name.startsWith(INPUT_PREFIX)) return -1;
    const suffix = name.slice(INPUT_PREFIX.length);
    return /^\d+$/.test(suffix) ? Number(suffix) : -1;
}

function getWidget(node, name) {
    return node.widgets?.find((widget) => widget.name === name);
}

function getPromptWidget(node, index) {
    return getWidget(node, `${INPUT_PREFIX}${index}`);
}

function getPromptInput(node, index) {
    return node.inputs?.find((input) => input.name === `${INPUT_PREFIX}${index}`);
}

function allocatedPromptCount(node) {
    let highest = -1;
    for (const widget of node.widgets || []) highest = Math.max(highest, promptIndex(widget));
    return highest + 1;
}

function promptConfig() {
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
            if (Array.isArray(candidate())) widgetLink[symbol] = promptConfig;
        } catch {
            // 不是输入配置读取器的 symbol，忽略。
        }
    }
    return widgetLink;
}

function addPromptInput(node, index) {
    const existing = getPromptInput(node, index);
    if (existing) {
        existing.widget || (existing.widget = {name: existing.name});
        attachWidgetConfig(node, existing.widget);
        return existing;
    }
    const name = `${INPUT_PREFIX}${index}`;
    const widgetLink = attachWidgetConfig(node, {name});
    return node.addInput(name, "STRING", {widget: widgetLink});
}

function markWorkflowChanged(node) {
    node.graph?.setDirtyCanvas?.(true, true);
    app.graph?.setDirtyCanvas?.(true, true);
    clearTimeout(node._elzaPromptSwitchChangeTimer);
    node._elzaPromptSwitchChangeTimer = setTimeout(() => {
        app.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState?.();
    }, 150);
}

function collectPromptValues(node) {
    const count = allocatedPromptCount(node);
    const prompts = [];
    for (let index = 0; index < count; index++) {
        prompts.push(String(getPromptWidget(node, index)?.value ?? ""));
    }
    return prompts;
}

function writeState(node, activeCount) {
    const prompts = collectPromptValues(node);
    node.properties || (node.properties = {});
    node.properties[STATE_PROPERTY] = JSON.stringify({
        version: STATE_VERSION,
        count: clampCount(activeCount),
        allocated: prompts.length,
        prompts,
    });
    delete node.properties[LEGACY_PROPERTY];
}

function createPromptWidget(node, index, value = "", visible = false) {
    const name = `${INPUT_PREFIX}${index}`;
    const result = ComfyWidgets.STRING(node, name, promptConfig(), app);
    const widget = result.widget;
    widget.label = name;
    widget.options || (widget.options = {});
    widget.options.getMinHeight = () => 68;
    widget.options.getMaxHeight = () => 110;
    widget.hidden = !visible;
    widget.options.hidden = !visible;
    if (widget.element) {
        widget.element.placeholder = `输入 ${name} 的多行 Prompt`;
        widget.element.rows = 3;
    }

    const originalCallback = widget.callback;
    widget.callback = function () {
        const resultValue = originalCallback?.apply(this, arguments);
        if (!node._elzaPromptSwitchApplying) {
            const activeCount = clampCount(getWidget(node, "count")?.value ?? DEFAULT_COUNT);
            writeState(node, activeCount);
            markWorkflowChanged(node);
        }
        return resultValue;
    };
    node._elzaPromptSwitchApplying = true;
    try {
        widget.value = String(value ?? "");
    } finally {
        node._elzaPromptSwitchApplying = false;
    }
    return widget;
}

function ensurePromptWidgets(node, requestedCount, values = []) {
    const target = clampCount(requestedCount);
    for (let index = allocatedPromptCount(node); index < target; index++) {
        createPromptWidget(node, index, values[index] ?? "", false);
    }
}

function setWidgetValue(widget, value) {
    if (!widget) return;
    widget.value = value;
    if (widget.inputEl) widget.inputEl.value = String(value);
    if (widget.element && "value" in widget.element) widget.element.value = String(value);
}

function setIndexRange(node, count) {
    const widget = getWidget(node, "index");
    if (!widget) return;
    widget.options || (widget.options = {});
    widget.options.min = 0;
    widget.options.max = count - 1;
    const current = Number.parseInt(widget.value, 10);
    setWidgetValue(widget, Number.isFinite(current)
        ? Math.max(0, Math.min(count - 1, current))
        : 0);
}

function removePromptSlot(node, index) {
    const position = node.inputs?.findIndex((input) => input.name === `${INPUT_PREFIX}${index}`) ?? -1;
    if (position >= 0) node.removeInput(position);

    const widget = getPromptWidget(node, index);
    if (widget) node.removeWidget(widget);
}

function trimPromptSlots(node, targetCount) {
    for (let index = allocatedPromptCount(node) - 1; index >= targetCount; index--) {
        removePromptSlot(node, index);
    }
}

function fitNodeToPromptContent(node) {
    const computed = node.computeSize?.();
    if (!Array.isArray(computed) || computed.length < 2) return;
    const currentWidth = Number(node.size?.[0]) || 0;
    node.setSize?.([Math.max(currentWidth, computed[0]), computed[1]]);
}

function applyPromptCount(node, requestedCount, {recordChange = false, fit = false} = {}) {
    if (recordChange) app.graph?.beforeChange?.();
    const wasApplyingCount = Boolean(node._elzaPromptSwitchApplyingCount);
    node._elzaPromptSwitchApplyingCount = true;
    try {
        const requested = clampCount(requestedCount);
        ensurePromptWidgets(node, requested);
        trimPromptSlots(node, requested);

        for (let index = 0; index < allocatedPromptCount(node); index++) {
            const widget = getPromptWidget(node, index);
            if (!widget) continue;
            widget.hidden = false;
            widget.options || (widget.options = {});
            widget.options.hidden = false;
            const input = addPromptInput(node, index);
            const connected = input?.link != null;
            if (widget.element) {
                widget.element.disabled = connected;
                widget.element.readOnly = connected;
            }
        }

        setWidgetValue(getWidget(node, "count"), requested);
        setIndexRange(node, requested);
        writeState(node, requested);
        if (fit) fitNodeToPromptContent(node);
        node.setDirtyCanvas?.(true, true);
        return requested;
    } finally {
        node._elzaPromptSwitchApplyingCount = wasApplyingCount;
        if (recordChange) app.graph?.afterChange?.();
    }
}

function applySavedState(node, state, {fit = false} = {}) {
    const normalized = state || makeState(DEFAULT_COUNT, []);
    ensurePromptWidgets(node, normalized.prompts.length, normalized.prompts);
    node._elzaPromptSwitchApplying = true;
    try {
        normalized.prompts.forEach((value, index) => {
            setWidgetValue(getPromptWidget(node, index), value);
        });
    } finally {
        node._elzaPromptSwitchApplying = false;
    }
    return applyPromptCount(node, normalized.count, {fit});
}

function updatePromptCount(node) {
    const requested = clampCount(getWidget(node, "count")?.value ?? DEFAULT_COUNT);
    const effective = applyPromptCount(node, requested, {
        recordChange: true,
        fit: true,
    });
    markWorkflowChanged(node);
    return effective;
}

function ensureUpdateButton(node) {
    const existing = getWidget(node, UPDATE_WIDGET_NAME);
    if (existing) return existing;
    const widget = node.addWidget("button", UPDATE_WIDGET_NAME, null, () => {
        updatePromptCount(node);
    });
    return widget;
}

app.registerExtension({
    name: "Elza.PromptHub.PromptSwitch",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_NAME) return;

        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = originalOnNodeCreated?.apply(this, arguments);
            ensureUpdateButton(this);
            applySavedState(this, readPropertyState(this) || makeState(DEFAULT_COUNT, []), {fit: true});
            return result;
        };

        const originalOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
            const configuredState = readPropertyState({properties: info?.properties || {}});
            const legacyState = readLegacyWidgets(info);
            const state = configuredState || legacyState || makeState(DEFAULT_COUNT, []);
            ensureUpdateButton(this);
            ensurePromptWidgets(this, state.prompts.length, state.prompts);
            const result = originalOnConfigure?.apply(this, arguments);
            applySavedState(this, state, {fit: true});
            return result;
        };

        const originalOnConnectionsChange = nodeType.prototype.onConnectionsChange;
        nodeType.prototype.onConnectionsChange = function () {
            const result = originalOnConnectionsChange?.apply(this, arguments);
            if (app.configuringGraph || !this.graph || this._elzaPromptSwitchApplyingCount) {
                return result;
            }
            const count = clampCount(getWidget(this, "count")?.value ?? DEFAULT_COUNT);
            applyPromptCount(this, count);
            return result;
        };

        const originalOnRemoved = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function () {
            clearTimeout(this._elzaPromptSwitchChangeTimer);
            return originalOnRemoved?.apply(this, arguments);
        };
    },
});
