import { app } from "../../scripts/app.js";

const BANK_NODE = "ElzaPromptHub_PromptBank";
const MIX_NODE = "ElzaPromptHub_PromptMix";
const RANDOM_NODE = "ElzaPromptHub_RandomPrompt";
const RESOLUTION_NODE = "ElzaPromptHub_Resolution";
const BANK_STATE = "elza_prompt_bank_state";
const MIX_STATE = "elza_prompt_mix_state";

const STYLE_ID = "elza-prompt-hub-v3-style";
if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
.elza-ph-overlay{position:fixed;inset:0;z-index:10020;background:rgba(4,7,12,.72);display:flex;align-items:center;justify-content:center;font:13px Inter,"Segoe UI",sans-serif;color:#e9edf5}
.elza-ph-dialog{width:min(1240px,94vw);height:min(780px,90vh);display:flex;flex-direction:column;background:#171a21;border:1px solid #343a49;border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.58);overflow:hidden}
.elza-ph-dialog.compact{width:min(560px,92vw);height:auto;max-height:86vh}.elza-ph-dialog.medium{width:min(820px,92vw);height:min(690px,86vh)}.elza-ph-dialog.candidate-editor{width:min(820px,92vw);height:auto;max-height:70vh}
.elza-ph-header,.elza-ph-footer{display:flex;align-items:center;gap:9px;padding:12px 14px;background:#14171d}.elza-ph-header{border-bottom:1px solid #2a2f3b}.elza-ph-footer{border-top:1px solid #2a2f3b;justify-content:flex-end}
.elza-ph-title{font-size:16px;font-weight:700}.elza-ph-spacer{flex:1}.elza-ph-status{color:#9ba6b8;margin-right:auto}.elza-ph-status.error{color:#ffaaa8}.elza-ph-status.ok{color:#91d7a0}
.elza-ph-button,.elza-ph-select,.elza-ph-input{border:1px solid #3b4252;border-radius:7px;background:#222731;color:#edf1f8;padding:7px 10px;box-sizing:border-box}.elza-ph-button{cursor:pointer}.elza-ph-button:hover{background:#2d3340}.elza-ph-button.primary{background:#7458e8;border-color:#8a73ef}.elza-ph-button.danger{color:#ffb5b5}.elza-ph-button.ghost{background:transparent;border-color:transparent}.elza-ph-button:disabled{opacity:.45;cursor:not-allowed}.elza-ph-mini{padding:4px 7px}.elza-ph-icon{padding:3px 7px;font-size:16px}.elza-ph-search{width:min(300px,26vw)}
.elza-ph-body{display:grid;grid-template-columns:220px minmax(420px,1fr) 320px;min-height:0;flex:1}.elza-ph-body.mixer{grid-template-columns:220px minmax(520px,1fr)}.elza-ph-column{min-width:0;min-height:0;overflow:auto;border-right:1px solid #2a2f3b}.elza-ph-column:last-child{border-right:0}
.elza-ph-section-title{position:sticky;top:0;z-index:3;background:#191d25;border-bottom:1px solid #2a2f3b;padding:10px 12px;font-weight:700;display:flex;align-items:center;gap:7px}.elza-ph-list{padding:9px}
.elza-ph-row,.elza-ph-card{border:1px solid transparent;border-radius:8px;padding:9px 10px;margin-bottom:6px;background:#20252e;cursor:pointer}.elza-ph-row:hover,.elza-ph-card:hover{border-color:#4a5265}.elza-ph-row.active,.elza-ph-card.active{border-color:#8269ec;background:#292443}.elza-ph-row-line{display:flex;align-items:center;gap:6px}.elza-ph-row-line>span:first-child{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.elza-ph-muted{color:#939daf;font-size:12px}.elza-ph-source{color:#8792a5;font-size:11px;margin-top:5px;overflow-wrap:anywhere}.elza-ph-warning{color:#ffc46b}.elza-ph-empty{padding:30px;color:#909aac;text-align:center}
.elza-ph-subheader{display:flex;align-items:center;gap:7px;padding:10px 12px;border-bottom:1px solid #2a2f3b;background:#191d25;font-weight:700}.elza-ph-tabs{display:flex;gap:6px;padding:9px 10px;overflow-x:auto;overflow-y:hidden;border-bottom:1px solid #2a2f3b;scrollbar-width:thin}.elza-ph-tab{white-space:nowrap;display:flex;align-items:center;gap:3px}.elza-ph-tab .elza-ph-button{padding:2px 5px}
.elza-ph-entry-grid,.elza-ph-container-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;padding:11px}.elza-ph-entry-grid .elza-ph-card,.elza-ph-container-grid .elza-ph-card{margin:0}.elza-ph-card-title{font-weight:700;overflow-wrap:anywhere}.elza-ph-card-text{color:#aeb7c6;margin-top:4px;overflow-wrap:anywhere;white-space:pre-wrap}.elza-ph-card-head{display:flex;align-items:flex-start;gap:5px}.elza-ph-card-head .elza-ph-card-title{flex:1}.elza-ph-count{padding:2px 6px;border-radius:10px;background:#333a48;color:#bdc6d5;font-size:11px}
.elza-ph-selected{display:grid;grid-template-columns:18px minmax(0,1fr) 64px 28px;align-items:center;gap:7px}.elza-ph-selected .elza-ph-weight{width:64px;padding:5px 6px;text-align:center;font-variant-numeric:tabular-nums}.elza-ph-drag{color:#8d97a9;cursor:grab}.elza-ph-selected.dragging{opacity:.45}.elza-ph-snapshot{border-color:#9a6d2a;color:#ffd18a}
.elza-ph-form{padding:14px;overflow:auto}.elza-ph-field{display:grid;gap:6px;margin-bottom:12px}.elza-ph-field label{font-weight:600}.elza-ph-field textarea{min-height:100px;resize:vertical}.elza-ph-error{color:#ffaaa8;min-height:18px}.elza-ph-help{color:#98a2b4;font-size:12px;line-height:1.55}
.elza-ph-menu{position:fixed;z-index:10050;min-width:155px;padding:5px;background:#20252e;border:1px solid #424a59;border-radius:8px;box-shadow:0 12px 36px rgba(0,0,0,.48)}.elza-ph-menu button{display:block;width:100%;border:0;background:transparent;color:#edf1f8;text-align:left;padding:8px 10px;border-radius:5px;cursor:pointer}.elza-ph-menu button:hover{background:#333947}.elza-ph-menu button.danger{color:#ffaaa8}
.elza-ph-file-list{padding:10px;overflow:auto}.elza-ph-file-row{display:grid;grid-template-columns:minmax(140px,1fr) auto;align-items:center;gap:8px;padding:9px;border-bottom:1px solid #2d3340}.elza-ph-file-actions{display:flex;gap:5px;flex-wrap:wrap}
.elza-ph-candidate-list{padding:10px;overflow:auto}.elza-ph-candidate{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start;padding:10px;border:1px solid #333a48;border-radius:8px;background:#20252e;margin-bottom:7px}.elza-ph-candidate-actions{display:flex;gap:5px}
.elza-mix-node{width:100%;height:100%;max-height:100%;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable;box-sizing:border-box;padding:4px 8px 28px 2px;color:#ddd;font:12px Inter,"Segoe UI",sans-serif}.elza-mix-node-tools{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}.elza-mix-node-select{flex:1 1 150px;min-width:110px;border:1px solid #555;border-radius:5px;background:#292929;color:#ddd;padding:4px 6px}.elza-mix-node button{border:1px solid #555;border-radius:5px;background:#292929;color:#ddd;padding:4px 7px;cursor:pointer}.elza-mix-node button:hover{background:#373737}.elza-mix-node-status{padding:5px 7px;border-radius:5px;background:rgba(255,255,255,.06);color:#aaa;margin-bottom:5px}.elza-mix-section{border-top:1px solid rgba(255,255,255,.12)}.elza-mix-section:last-child{margin-bottom:12px}.elza-mix-section-head{display:flex;width:100%;justify-content:space-between!important;border:0!important;border-radius:0!important;background:transparent!important;padding:7px 4px!important;font-weight:700}.elza-mix-section-body{display:grid;gap:4px;padding:0 0 7px}.elza-mix-row{display:grid;grid-template-columns:minmax(72px,.75fr) minmax(130px,1.5fr) 24px;align-items:center;gap:5px}.elza-mix-row-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#bbb}.elza-mix-choice{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}.elza-mix-choice.saved{border-color:#d49b42;color:#ffd18a}.elza-mix-clear{padding:3px!important;color:#ffb2b2!important}
.elza-ph-chooser-list{padding:9px;overflow:auto}.elza-ph-option{display:block;width:100%;text-align:left;margin-bottom:5px;border:1px solid transparent;border-radius:7px;background:#242a34;color:#edf1f7;padding:9px;cursor:pointer}.elza-ph-option:hover{border-color:#7864d8}.elza-ph-option small{display:block;color:#9ba5b6;margin-top:3px;overflow-wrap:anywhere}.elza-ph-option.saved{border-color:#9a6d2a;color:#ffd18a}.elza-ph-row-line .ghost,.elza-ph-card-head .ghost,.elza-ph-tab .ghost{opacity:0;transition:opacity .12s ease}.elza-ph-row:hover .ghost,.elza-ph-row:focus-within .ghost,.elza-ph-card:hover .ghost,.elza-ph-card:focus-within .ghost,.elza-ph-tab:hover .ghost,.elza-ph-tab:focus-within .ghost{opacity:1}.elza-ph-candidate-list{max-height:calc(70vh - 116px)}
`;
    document.head.appendChild(style);
}

function element(tag, className = "", text = "") {
    const value = document.createElement(tag);
    if (className) value.className = className;
    if (text !== "") value.textContent = text;
    return value;
}

function button(label, handler, className = "") {
    const value = element("button", `elza-ph-button ${className}`.trim(), label);
    value.type = "button";
    value.addEventListener("click", handler);
    return value;
}

function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeEntryWeight(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 1;
    return Math.min(10, Math.max(0, Math.round(number * 100) / 100));
}

function normalizedName(value) {
    return String(value || "").trim().toLocaleLowerCase();
}

function hasSiblingName(items, name, excluded = null) {
    const target = normalizedName(name);
    return (items || []).some((item) => item !== excluded && normalizedName(item?.name) === target);
}

const RESOLUTION_PRESETS = {"512级": 512, "768级": 768, "1024级": 1024, "1280级": 1280, "1536级": 1536, "2048级": 2048};
const RESOLUTION_RATIOS = {"1:1": [1, 1], "3:2": [3, 2], "2:3": [2, 3], "4:3": [4, 3], "3:4": [3, 4], "16:9": [16, 9], "9:16": [9, 16], "21:9": [21, 9], "9:21": [9, 21]};

function syncResolutionWidgets(node) {
    const mode = getWidget(node, "mode")?.value;
    const preset = getWidget(node, "size_preset")?.value;
    if (mode === "自定义") return;
    const base = RESOLUTION_PRESETS[preset];
    const ratio = RESOLUTION_RATIOS[getWidget(node, "aspect_ratio")?.value] || [1, 1];
    const rawFactor = Number(getWidget(node, "scale_factor")?.value);
    const factor = Number.isFinite(rawFactor) ? Math.max(0.1, Math.min(4, rawFactor)) : 1;
    if (!base) return;
    const round = (value) => Math.max(64, Math.round(value / 8) * 8);
    let width = round(base * factor * ratio[0] / Math.max(ratio[0], ratio[1]));
    let height = round(base * factor * ratio[1] / Math.max(ratio[0], ratio[1]));
    let changed = false;
    for (const [name, value] of [["width", width], ["height", height]]) {
        const widget = getWidget(node, name);
        if (!widget) continue;
        changed ||= Number(widget.value) !== value;
        widget.value = value;
        if (widget.inputEl) widget.inputEl.value = String(value);
    }
    if (changed) markChanged(node);
}

function setResolutionWidgetVisible(widget, visible) {
    if (!widget) return;
    // 旧实现通过替换 computeSize 隐藏控件。经历一次“隐藏 → 显示”后，
    // 负高度函数可能被误存为原始函数，最终造成所有控件重叠。
    if (Object.prototype.hasOwnProperty.call(widget, "_elzaResolutionComputeSize")) {
        widget.computeSize = widget._elzaResolutionComputeSize;
        delete widget._elzaResolutionComputeSize;
    }
    widget.hidden = !visible;
    widget.options || (widget.options = {});
    widget.options.hidden = !visible;
    const input = widget.inputEl || widget.element;
    if (input) input.style.display = visible ? "" : "none";
}

function setResolutionWidgetEditable(widget, editable) {
    if (!widget) return;
    widget.readOnly = !editable;
    widget.disabled = !editable;
    const input = widget.inputEl || widget.element;
    if (input) {
        input.readOnly = !editable;
        input.disabled = !editable;
        input.style.opacity = editable ? "1" : "0.72";
    }
}

function applyResolutionMode(node) {
    const custom = getWidget(node, "mode")?.value === "自定义";
    setResolutionWidgetVisible(getWidget(node, "size_preset"), !custom);
    setResolutionWidgetVisible(getWidget(node, "aspect_ratio"), !custom);
    setResolutionWidgetVisible(getWidget(node, "scale_factor"), !custom);
    setResolutionWidgetVisible(getWidget(node, "width"), true);
    setResolutionWidgetVisible(getWidget(node, "height"), true);
    setResolutionWidgetEditable(getWidget(node, "width"), custom);
    setResolutionWidgetEditable(getWidget(node, "height"), custom);
    if (!custom) syncResolutionWidgets(node);
    const currentSize = Array.isArray(node.size) ? [...node.size] : [0, 0];
    const minimumSize = node.computeSize?.();
    if (node.setSize && Array.isArray(minimumSize)) {
        node.setSize([
            Math.max(currentSize[0] || 0, minimumSize[0] || 0),
            minimumSize[1] || currentSize[1] || 0,
        ]);
    }
    node.graph?.setDirtyCanvas?.(true, true);
}

function swapResolutionWidgets(node) {
    const mode = getWidget(node, "mode")?.value;
    if (mode === "常用尺寸") {
        const aspect = getWidget(node, "aspect_ratio");
        const [width, height] = String(aspect?.value || "1:1").split(":");
        const reversed = `${height}:${width}`;
        if (aspect && RESOLUTION_RATIOS[reversed]) {
            aspect.value = reversed;
            if (aspect.inputEl) aspect.inputEl.value = reversed;
        }
        syncResolutionWidgets(node);
        return;
    }
    const width = getWidget(node, "width");
    const height = getWidget(node, "height");
    if (!width || !height) return;
    [width.value, height.value] = [height.value, width.value];
    if (width.inputEl) width.inputEl.value = String(width.value);
    if (height.inputEl) height.inputEl.value = String(height.value);
    markChanged(node);
}

async function openDocumentFolder(kind, documentId, statusTarget) {
    if (!documentId) return;
    try {
        const payload = await requestJson(`/elza/prompt-hub/documents/${encodeURIComponent(kind)}/${encodeURIComponent(documentId)}/open-folder`, {method: "POST"});
        setStatus(statusTarget, `已打开文件夹：${payload.folder}`, "ok");
    } catch (error) {
        setStatus(statusTarget, `打开文件夹失败：${error.message}`, "error");
    }
}

function setupResolutionNode(node) {
    if (node._elzaResolutionSetup) { applyResolutionMode(node); return; }
    node._elzaResolutionSetup = true;
    const factorWidget = getWidget(node, "scale_factor");
    if (factorWidget) factorWidget.label = "系数";
    for (const name of ["mode", "size_preset", "aspect_ratio", "scale_factor"]) {
        const widget = getWidget(node, name);
        if (!widget) continue;
        const original = widget.callback;
        widget.callback = function () {
            const result = original?.apply(this, arguments);
            applyResolutionMode(node);
            return result;
        };
    }
    node.addWidget("button", "交换宽高", null, () => swapResolutionWidgets(node));
    applyResolutionMode(node);
}

function newId(prefix) {
    const random = globalThis.crypto?.randomUUID?.().replaceAll("-", "").slice(0, 12)
        || Math.random().toString(16).slice(2, 14);
    return `${prefix}-${random}`;
}

function getWidget(node, name) {
    return node.widgets?.find((item) => item.name === name);
}

function setWidgetValue(node, name, value) {
    const widget = getWidget(node, name);
    if (!widget) return;
    widget.value = value;
    if (widget.inputEl) widget.inputEl.value = String(value);
    if (widget.element && "value" in widget.element) widget.element.value = String(value);
    widget.callback?.(value);
}

function markChanged(node) {
    node.graph?.setDirtyCanvas?.(true, true);
    app.graph?.setDirtyCanvas?.(true, true);
    app.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState?.();
}

function readState(node, key, fallback) {
    const value = node.properties?.[key];
    if (value && typeof value === "object") return deepCopy(value);
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === "object") return parsed;
        } catch {
            // 旧状态损坏时使用默认值。
        }
    }
    return deepCopy(fallback);
}

function writeState(node, key, state) {
    node.properties || (node.properties = {});
    node.properties[key] = JSON.stringify(state);
    markChanged(node);
}

async function requestJson(url, options = {}) {
    const headers = {...(options.headers || {})};
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const response = await fetch(url, {...options, headers});
    let payload = {};
    try {
        payload = await response.json();
    } catch {
        throw new Error(`请求失败（HTTP ${response.status}）`);
    }
    if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || `请求失败（HTTP ${response.status}）`);
    }
    return payload;
}

function downloadName(response, fallback) {
    const header = response.headers.get("Content-Disposition") || "";
    const match = header.match(/filename="?([^";]+)"?/i);
    return match?.[1] || fallback;
}

async function requestBlob(url, fallbackName) {
    const response = await fetch(url);
    if (!response.ok) {
        let message = `请求失败（HTTP ${response.status}）`;
        try {
            const payload = await response.json();
            message = payload.error?.message || message;
        } catch {
            // 非 JSON 错误响应使用 HTTP 状态。
        }
        throw new Error(message);
    }
    return {blob: await response.blob(), filename: downloadName(response, fallbackName)};
}

async function saveBlobWithPicker(blob, filename) {
    if (typeof globalThis.showSaveFilePicker === "function") {
        const extension = filename.toLowerCase().endsWith(".zip") ? ".zip" : ".yaml";
        const mime = extension === ".zip" ? "application/zip" : "application/yaml";
        try {
            const handle = await globalThis.showSaveFilePicker({
                suggestedName: filename,
                types: [{description: extension === ".zip" ? "ZIP 备份" : "YAML 词库", accept: {[mime]: [extension]}}],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return true;
        } catch (error) {
            if (error?.name === "AbortError") return false;
            throw error;
        }
    }
    const url = URL.createObjectURL(blob);
    const link = element("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
}

function makeDialog(title, size = "") {
    const overlay = element("div", "elza-ph-overlay");
    const dialog = element("div", `elza-ph-dialog ${size}`.trim());
    const header = element("div", "elza-ph-header");
    header.append(element("div", "elza-ph-title", title));
    const body = element("div", "elza-ph-body");
    const footer = element("div", "elza-ph-footer");
    dialog.append(header, body, footer);
    overlay.append(dialog);
    document.body.append(overlay);
    return {overlay, dialog, header, body, footer};
}

function formDialog(title, fields, submitLabel = "确定") {
    return new Promise((resolve) => {
        const view = makeDialog(title, "compact");
        view.body.className = "elza-ph-form";
        const inputs = {};
        const error = element("div", "elza-ph-error");
        for (const field of fields) {
            const wrapper = element("div", "elza-ph-field");
            const label = element("label", "", field.label);
            const input = element(field.multiline ? "textarea" : "input", "elza-ph-input");
            input.value = String(field.value ?? "");
            if (!field.multiline) input.type = field.type || "text";
            if (field.placeholder) input.placeholder = field.placeholder;
            wrapper.append(label, input);
            if (field.help) wrapper.append(element("div", "elza-ph-help", field.help));
            view.body.append(wrapper);
            inputs[field.name] = input;
        }
        view.body.append(error);
        const finish = (value) => {
            document.removeEventListener("keydown", onKey);
            view.overlay.remove();
            resolve(value);
        };
        const submit = () => {
            const result = {};
            for (const field of fields) {
                const value = inputs[field.name].value.trim();
                if (field.required !== false && !value) {
                    error.textContent = `请填写“${field.label}”`;
                    inputs[field.name].focus();
                    return;
                }
                result[field.name] = value;
            }
            finish(result);
        };
        const onKey = (event) => {
            if (event.key === "Escape") finish(null);
            if (event.key === "Enter" && !event.shiftKey && event.target.tagName !== "TEXTAREA") submit();
        };
        document.addEventListener("keydown", onKey);
        view.overlay.addEventListener("click", (event) => { if (event.target === view.overlay) finish(null); });
        view.footer.append(button("取消", () => finish(null)), button(submitLabel, submit, "primary"));
        inputs[fields[0]?.name]?.focus();
    });
}

function confirmDialog(title, message, confirmLabel = "删除") {
    return new Promise((resolve) => {
        const view = makeDialog(title, "compact");
        view.body.className = "elza-ph-form";
        view.body.append(element("div", "elza-ph-card-text", message));
        const finish = (value) => { view.overlay.remove(); resolve(value); };
        view.overlay.addEventListener("click", (event) => { if (event.target === view.overlay) finish(false); });
        view.footer.append(button("取消", () => finish(false)), button(confirmLabel, () => finish(true), "danger"));
    });
}

function showContextMenu(event, items) {
    event.preventDefault();
    event.stopPropagation();
    document.querySelectorAll(".elza-ph-menu").forEach((item) => item.remove());
    const menu = element("div", "elza-ph-menu");
    for (const item of items) {
        const action = element("button", item.danger ? "danger" : "", item.label);
        action.type = "button";
        action.addEventListener("click", () => { menu.remove(); item.action(); });
        menu.append(action);
    }
    document.body.append(menu);
    const width = 170;
    menu.style.left = `${Math.min(event.clientX, innerWidth - width - 8)}px`;
    menu.style.top = `${Math.min(event.clientY, innerHeight - menu.offsetHeight - 8)}px`;
    const close = (closeEvent) => {
        if (!menu.contains(closeEvent.target)) menu.remove();
        document.removeEventListener("pointerdown", close);
    };
    setTimeout(() => document.addEventListener("pointerdown", close), 0);
}

function setStatus(instance, text, type = "") {
    if (!instance.status) return;
    instance.status.className = `elza-ph-status ${type}`.trim();
    instance.status.textContent = text;
}

function bankEntryKey(sourcePath, name, text) {
    return `${sourcePath}\u0000${name}\u0000${text}`;
}

function bankLibraryKeys(document) {
    const keys = new Set();
    for (const category of document?.categories || []) {
        for (const group of category.children || []) {
            const source = `${document.name} / ${category.name} / ${group.name}`;
            for (const entry of group.entries || []) keys.add(bankEntryKey(source, entry.name, entry.text));
        }
    }
    return keys;
}

function reconcileBankNode(node, document) {
    const state = readState(node, BANK_STATE, {version: 3, document_id: "", selected: []});
    if (state.document_id !== document.id || !Array.isArray(state.selected)) return;
    const keys = bankLibraryKeys(document);
    state.selected = state.selected.map((item) => ({
        name_snapshot: String(item.name_snapshot || ""),
        text_snapshot: String(item.text_snapshot || ""),
        source_path: String(item.source_path || ""),
        weight: normalizeEntryWeight(item.weight),
        source_missing: !keys.has(bankEntryKey(item.source_path, item.name_snapshot, item.text_snapshot)),
    }));
    writeState(node, BANK_STATE, state);
    setWidgetValue(node, "text_display", state.selected.length
        ? state.selected.map((item) => item.text_snapshot).join(", ") : "(空)");
}

async function refreshAffectedNodes(kind, document) {
    for (const node of app.graph?._nodes || []) {
        if (kind === "bank" && node.comfyClass === BANK_NODE) reconcileBankNode(node, document);
        if (kind === "mix" && node.comfyClass === MIX_NODE) {
            const state = normalizeMixState(readState(node, MIX_STATE, {}));
            if (state.document_id === document.id) await node._elzaMixReload?.(document.id);
        }
    }
    app.graph?.setDirtyCanvas?.(true, true);
}

function refreshDeletedDocumentNodes(kind, documentId) {
    for (const node of app.graph?._nodes || []) {
        if (kind === "bank" && node.comfyClass === BANK_NODE) {
            const state = readState(node, BANK_STATE, {version: 3, document_id: "", selected: []});
            if (state.document_id !== documentId || !Array.isArray(state.selected)) continue;
            state.selected = state.selected.map((item) => ({...item, source_missing: true}));
            writeState(node, BANK_STATE, state);
            setWidgetValue(node, "text_display", state.selected.length
                ? state.selected.map((item) => item.text_snapshot).join(", ") : "(空)");
        }
        if (kind === "mix" && node.comfyClass === MIX_NODE) {
            const state = normalizeMixState(readState(node, MIX_STATE, {}));
            if (state.document_id !== documentId) continue;
            state.document_missing = true;
            writeState(node, MIX_STATE, compactMixState(state));
            node._elzaMixPanel?.markDocumentMissing(documentId);
        }
    }
    app.graph?.setDirtyCanvas?.(true, true);
}

async function exportOne(kind, documentId) {
    const result = await requestBlob(
        `/elza/prompt-hub/export/${kind}/${encodeURIComponent(documentId)}`,
        `${documentId}.yaml`,
    );
    await saveBlobWithPicker(result.blob, result.filename);
}

async function backupKind(kind) {
    const result = await requestBlob(`/elza/prompt-hub/export/${kind}`, `elza-prompt-${kind}-backup.zip`);
    return saveBlobWithPicker(result.blob, result.filename);
}

class FileManager {
    constructor(owner, kind) {
        this.owner = owner;
        this.kind = kind;
    }

    open() {
        const view = makeDialog(this.kind === "bank" ? "Prompt Bank 文件管理" : "Prompt Mixer 文件管理", "medium");
        this.view = view;
        view.body.className = "elza-ph-file-list";
        view.header.append(element("span", "elza-ph-spacer"), button("新建词库", () => this.create(), "primary"), button("导入", () => this.importFile()));
        view.footer.append(button("另存全部备份", () => this.backup()), button("关闭", () => view.overlay.remove()));
        this.render();
    }

    render() {
        this.view.body.replaceChildren();
        for (const item of this.owner.documents || []) {
            const row = element("div", "elza-ph-file-row");
            const name = element("div");
            name.append(element("div", "elza-ph-card-title", item.name), element("div", "elza-ph-source", `${item.id}.yaml`));
            const actions = element("div", "elza-ph-file-actions");
            actions.append(
                button("打开", async () => {
                    const switched = this.owner.switchDocument
                        ? await this.owner.switchDocument(item.id)
                        : (await this.owner.loadDocument(item.id), true);
                    if (switched !== false) this.view.overlay.remove();
                }, "elza-ph-mini"),
                button("改名", () => this.rename(item), "elza-ph-mini"),
                button("导出", () => this.run(() => exportOne(this.kind, item.id)), "elza-ph-mini"),
                button("删除", () => this.remove(item), "elza-ph-mini danger"),
            );
            row.append(name, actions);
            this.view.body.append(row);
        }
        if (!this.owner.documents?.length) this.view.body.append(element("div", "elza-ph-empty", "没有词库文件"));
    }

    async run(action) {
        try { await action(); } catch (error) { await formDialog("操作失败", [{name: "message", label: "错误", value: error.message, required: false, multiline: true}], "关闭"); }
    }

    async create() {
        const values = await formDialog("新建词库", [{name: "name", label: "词库名称", value: ""}]);
        if (!values) return;
        const document = {version: 3, kind: this.kind, id: newId(this.kind), name: values.name, categories: []};
        await this.run(async () => {
            const payload = await requestJson("/elza/prompt-hub/documents/" + this.kind, {
                method: "POST", body: JSON.stringify({document, expected_revision: null}),
            });
            await this.owner.reloadDocuments();
            if (this.owner.switchDocument) await this.owner.switchDocument(payload.document.id);
            else await this.owner.loadDocument(payload.document.id);
            this.render();
        });
    }

    async rename(item) {
        const values = await formDialog("词库改名", [{name: "name", label: "词库名称", value: item.name}]);
        if (!values || values.name === item.name) return;
        await this.run(async () => {
            const loaded = await requestJson(`/elza/prompt-hub/documents/${this.kind}/${encodeURIComponent(item.id)}`);
            loaded.document.name = values.name;
            await requestJson("/elza/prompt-hub/documents/" + this.kind, {
                method: "POST",
                body: JSON.stringify({document: loaded.document, expected_revision: loaded.revision}),
            });
            await this.owner.reloadDocuments();
            if (this.owner.document?.id === item.id) await this.owner.loadDocument(item.id);
            this.render();
        });
    }

    importFile() {
        const input = element("input");
        input.type = "file";
        input.accept = ".yaml,.yml,application/yaml,text/yaml";
        input.addEventListener("change", async () => {
            const file = input.files?.[0];
            if (!file) return;
            await this.run(async () => {
                const payload = await requestJson(`/elza/prompt-hub/import/${this.kind}`, {
                    method: "POST",
                    body: JSON.stringify({filename: file.name, content: await file.text()}),
                });
                await this.owner.reloadDocuments();
                if (this.owner.switchDocument) await this.owner.switchDocument(payload.document.id);
                else await this.owner.loadDocument(payload.document.id);
                this.render();
            });
        });
        input.click();
    }

    async remove(item) {
        const accepted = await confirmDialog("删除词库", `确定删除“${item.name}”吗？工作流中已保存的词条快照仍可继续输出。`);
        if (!accepted) return;
        await this.run(async () => {
            const deletingCurrentDocument = this.owner.document?.id === item.id;
            await requestJson(`/elza/prompt-hub/documents/${this.kind}/${encodeURIComponent(item.id)}`, {method: "DELETE"});
            refreshDeletedDocumentNodes(this.kind, item.id);
            await this.owner.reloadDocuments();
            if (deletingCurrentDocument) {
                const target = this.owner.documents[0]?.id;
                if (target) {
                    await this.owner.loadDocument(target);
                } else {
                    this.owner.document = null;
                    this.owner.render?.();
                }
            }
            this.render();
        });
    }

    async backup() {
        await this.run(async () => {
            const saved = await backupKind(this.kind);
            if (saved) this.view.footer.prepend(element("span", "elza-ph-status ok", "已保存到选择的位置"));
        });
    }
}

class BankDialog {
    constructor(node) {
        this.node = node;
        this.state = readState(node, BANK_STATE, {version: 3, document_id: "", selected: []});
        this.selected = Array.isArray(this.state.selected) ? deepCopy(this.state.selected) : [];
        this.documents = [];
        this.search = "";
        this.activeCategoryIndex = 0;
        this.activeGroupIndex = 0;
        this.undoSelection = null;
    }

    async open() {
        Object.assign(this, makeDialog("Prompt Bank"));
        this.status = element("span", "elza-ph-status", "正在载入词库…");
        this.footer.append(this.status);
        try {
            await this.reloadDocuments();
            const target = this.documents.some((item) => item.id === this.state.document_id)
                ? this.state.document_id : this.documents[0]?.id;
            await this.loadDocument(target);
        } catch (error) {
            setStatus(this, error.message, "error");
        }
    }

    async reloadDocuments() {
        const payload = await requestJson("/elza/prompt-hub/documents/bank");
        this.documents = payload.documents || [];
    }

    async loadDocument(documentId) {
        if (!documentId) return;
        const payload = await requestJson(`/elza/prompt-hub/documents/bank/${encodeURIComponent(documentId)}`);
        this.document = deepCopy(payload.document);
        this.revision = payload.revision;
        this.activeCategoryIndex = Math.min(this.activeCategoryIndex, Math.max(0, this.document.categories.length - 1));
        this.activeGroupIndex = 0;
        this.reconcileSelected();
        this.render();
    }

    async switchDocument(documentId) {
        if (!documentId || documentId === this.document?.id) return true;
        await this.loadDocument(documentId);
        return true;
    }

    reconcileSelected() {
        const keys = bankLibraryKeys(this.document);
        this.selected = this.selected.map((item) => ({
            name_snapshot: String(item.name_snapshot || ""),
            text_snapshot: String(item.text_snapshot || ""),
            source_path: String(item.source_path || ""),
            weight: normalizeEntryWeight(item.weight),
            source_missing: !keys.has(bankEntryKey(item.source_path, item.name_snapshot, item.text_snapshot)),
        }));
    }

    activeCategory() { return this.document?.categories?.[this.activeCategoryIndex]; }
    activeGroup() { return this.activeCategory()?.children?.[this.activeGroupIndex]; }

    render() {
        this.renderHeader();
        this.renderBody();
        this.renderFooter();
    }

    renderHeader() {
        this.header.replaceChildren(element("div", "elza-ph-title", "Prompt Bank"));
        const select = element("select", "elza-ph-select");
        for (const item of this.documents) {
            const option = element("option", "", item.name);
            option.value = item.id;
            option.selected = item.id === this.document?.id;
            select.append(option);
        }
        select.addEventListener("change", () => this.switchDocument(select.value));
        const search = element("input", "elza-ph-input elza-ph-search");
        search.placeholder = "搜索中文、Prompt 或来源路径";
        search.value = this.search;
        search.addEventListener("input", () => { this.search = search.value.trim().toLowerCase(); this.renderBody(); });
        this.header.append(
            select, search, element("span", "elza-ph-spacer"),
            button("文件管理", () => new FileManager(this, "bank").open()),
            button("打开文件夹", () => openDocumentFolder("bank", this.document?.id, this)),
            button("另存备份", () => this.saveBackup()),
            button("关闭", () => this.close()),
        );
    }

    renderBody() {
        this.body.className = "elza-ph-body";
        this.body.replaceChildren();
        const left = element("div", "elza-ph-column");
        const middle = element("div", "elza-ph-column");
        const right = element("div", "elza-ph-column");
        this.body.append(left, middle, right);

        const leftTitle = element("div", "elza-ph-section-title");
        leftTitle.append(element("span", "", "一级 Tag"), element("span", "elza-ph-spacer"), button("＋", () => this.addCategory(), "elza-ph-mini"));
        left.append(leftTitle);
        const categoryList = element("div", "elza-ph-list");
        for (const [index, category] of (this.document?.categories || []).entries()) {
            const row = element("div", `elza-ph-row ${index === this.activeCategoryIndex ? "active" : ""}`);
            const line = element("div", "elza-ph-row-line");
            line.append(element("span", "", category.name));
            const more = button("···", (event) => this.categoryMenu(event, category), "elza-ph-mini ghost");
            line.append(more);
            row.append(line, element("div", "elza-ph-source", `${category.children?.length || 0} 个二级 Tag`));
            row.addEventListener("click", () => { this.activeCategoryIndex = index; this.activeGroupIndex = 0; this.search = ""; this.render(); });
            row.addEventListener("contextmenu", (event) => this.categoryMenu(event, category));
            categoryList.append(row);
        }
        if (!this.document?.categories?.length) categoryList.append(element("div", "elza-ph-empty", "点击 ＋ 新建一级 Tag"));
        left.append(categoryList);

        const category = this.activeCategory();
        const groupHeader = element("div", "elza-ph-subheader");
        groupHeader.append(element("span", "", "二级 Tag"), element("span", "elza-ph-muted", category ? `${category.children?.length || 0} 个` : ""), element("span", "elza-ph-spacer"));
        middle.append(groupHeader);
        const tabs = element("div", "elza-ph-tabs");
        for (const [index, group] of (category?.children || []).entries()) {
            const tab = element("div", `elza-ph-tab ${index === this.activeGroupIndex ? "active" : ""}`);
            const selectTab = button(group.name, () => { this.activeGroupIndex = index; this.search = ""; this.renderBody(); }, index === this.activeGroupIndex ? "primary" : "");
            selectTab.addEventListener("contextmenu", (event) => this.groupMenu(event, group));
            tab.append(selectTab);
            tabs.append(tab);
        }
        if (category) {
            tabs.append(button("＋ 二级", () => this.addGroup(category), "elza-ph-tab"));
            if ((category.children || []).length > 5) tabs.append(button("全部 ▼", (event) => this.openGroupChooser(event), "elza-ph-tab"));
        }
        middle.append(tabs);

        const activeGroup = this.activeGroup();
        const title = element("div", "elza-ph-section-title", this.search ? "搜索结果" : `词条${activeGroup ? ` · ${activeGroup.name}` : ""}`);
        if (activeGroup) title.append(element("span", "elza-ph-spacer"), button("＋ 词条", () => this.addEntry(activeGroup), "elza-ph-mini"));
        middle.append(title);
        const grid = element("div", "elza-ph-entry-grid");
        for (const item of this.entriesForView()) {
            const selected = this.selected.some((entry) => bankEntryKey(entry.source_path, entry.name_snapshot, entry.text_snapshot)
                === bankEntryKey(item.sourcePath, item.entry.name, item.entry.text));
            const card = element("div", `elza-ph-card ${selected ? "active" : ""}`);
            const head = element("div", "elza-ph-card-head");
            head.append(element("div", "elza-ph-card-title", item.entry.name), button("···", (event) => this.entryMenu(event, item.group, item.entry), "elza-ph-mini ghost"));
            card.append(head, element("div", "elza-ph-card-text", item.entry.text));
            if (this.search) card.append(element("div", "elza-ph-source", item.sourcePath));
            card.addEventListener("click", () => this.toggleEntry(item));
            card.addEventListener("contextmenu", (event) => this.entryMenu(event, item.group, item.entry));
            grid.append(card);
        }
        if (!grid.childElementCount) grid.append(element("div", "elza-ph-empty", activeGroup ? "当前二级 Tag 没有词条" : "请先新建二级 Tag"));
        middle.append(grid);

        const rightTitle = element("div", "elza-ph-section-title");
        rightTitle.append(element("span", "", `已选内容 ${this.selected.length} 项`), element("span", "elza-ph-spacer"));
        if (this.undoSelection) rightTitle.append(button("撤销清空", () => this.undoClearSelected(), "elza-ph-mini"));
        rightTitle.append(button("清空", () => this.clearSelected(), "elza-ph-mini"));
        right.append(rightTitle);
        const selectedList = element("div", "elza-ph-list");
        this.selected.forEach((item, index) => {
            const row = element("div", `elza-ph-row elza-ph-selected ${item.source_missing ? "elza-ph-snapshot" : ""}`);
            row.draggable = true;
            row.dataset.index = String(index);
            row.addEventListener("dragstart", () => row.classList.add("dragging"));
            row.addEventListener("dragend", () => row.classList.remove("dragging"));
            row.addEventListener("dragover", (event) => event.preventDefault());
            row.addEventListener("drop", (event) => {
                event.preventDefault();
                const from = Number(selectedList.querySelector(".dragging")?.dataset.index);
                if (Number.isInteger(from) && from !== index) {
                    this.undoSelection = null;
                    const moved = this.selected.splice(from, 1)[0];
                    this.selected.splice(index, 0, moved);
                    this.renderBody();
                }
            });
            row.addEventListener("dblclick", (event) => {
                if (event.target.closest("input, button")) return;
                const located = this.locateSelectedItem(item);
                if (!located) return;
                this.activeCategoryIndex = located.categoryIndex;
                this.activeGroupIndex = located.groupIndex;
                this.search = "";
                this.renderBody();
            });
            const label = element("div");
            label.append(
                element("div", "elza-ph-card-title", item.name_snapshot || item.text_snapshot),
                element("div", "elza-ph-card-text", item.text_snapshot),
            );
            if (item.source_missing) label.append(element("div", "elza-ph-source elza-ph-warning", "工作流保存值（词库中已删除或改名）"));
            const weight = element("input", "elza-ph-input elza-ph-weight");
            weight.type = "number";
            weight.min = "0";
            weight.max = "10";
            weight.step = "0.05";
            weight.value = String(normalizeEntryWeight(item.weight));
            weight.title = "单条词条权重，1 表示原样输出";
            weight.addEventListener("click", (event) => event.stopPropagation());
            weight.addEventListener("change", (event) => {
                this.undoSelection = null;
                item.weight = normalizeEntryWeight(event.target.value);
                event.target.value = String(item.weight);
            });
            row.append(element("span", "elza-ph-drag", "⠿"), label, weight, button("×", () => { this.undoSelection = null; this.selected.splice(index, 1); this.renderBody(); }, "elza-ph-mini danger"));
            selectedList.append(row);
        });
        if (!this.selected.length) selectedList.append(element("div", "elza-ph-empty", "点击中间词条加入当前节点"));
        right.append(selectedList);
    }

    locateSelectedItem(item) {
        for (const [categoryIndex, category] of (this.document?.categories || []).entries()) {
            for (const [groupIndex, group] of (category.children || []).entries()) {
                const sourcePath = `${this.document.name} / ${category.name} / ${group.name}`;
                if (sourcePath !== item.source_path) continue;
                if ((group.entries || []).some((entry) => entry.name === item.name_snapshot && entry.text === item.text_snapshot)) {
                    return {categoryIndex, groupIndex};
                }
            }
        }
        return null;
    }

    renderFooter() {
        this.footer.replaceChildren();
        this.status = element("span", "elza-ph-status", "词库维护操作会立即保存；“应用到节点”只提交当前选择");
        this.footer.append(this.status, button("关闭（不应用选择）", () => this.close()), button("应用到节点", () => this.apply(), "primary"));
    }

    entriesForView() {
        const result = [];
        const categories = this.search ? (this.document?.categories || []) : [this.activeCategory()].filter(Boolean);
        for (const category of categories) {
            const groups = this.search ? (category.children || []) : [this.activeGroup()].filter(Boolean);
            for (const group of groups) {
                const sourcePath = `${this.document.name} / ${category.name} / ${group.name}`;
                for (const entry of group.entries || []) {
                    const haystack = `${entry.name} ${entry.text} ${(entry.aliases || []).join(" ")} ${sourcePath}`.toLowerCase();
                    if (!this.search || haystack.includes(this.search)) result.push({entry, group, sourcePath});
                }
            }
        }
        return result;
    }

    clearSelected() {
        if (!this.selected.length) return;
        this.undoSelection = deepCopy(this.selected);
        this.selected = [];
        this.renderBody();
    }

    undoClearSelected() {
        if (!this.undoSelection) return;
        this.selected = this.undoSelection;
        this.undoSelection = null;
        this.renderBody();
    }

    toggleEntry(item) {
        this.undoSelection = null;
        const key = bankEntryKey(item.sourcePath, item.entry.name, item.entry.text);
        const index = this.selected.findIndex((entry) => bankEntryKey(entry.source_path, entry.name_snapshot, entry.text_snapshot) === key);
        if (index >= 0) this.selected.splice(index, 1);
        else this.selected.push({name_snapshot: item.entry.name, text_snapshot: item.entry.text, source_path: item.sourcePath, weight: 1, source_missing: false});
        this.renderBody();
    }

    categoryMenu(event, category) {
        showContextMenu(event, [
            {label: "新增二级 Tag", action: () => this.addGroup(category)},
            {label: "一级 Tag 改名", action: () => this.renameCategory(category)},
            {label: "删除一级 Tag", danger: true, action: () => this.deleteCategory(category)},
        ]);
    }

    groupMenu(event, group) {
        showContextMenu(event, [
            {label: "新增词条", action: () => this.addEntry(group)},
            {label: "二级 Tag 改名", action: () => this.renameGroup(group)},
            {label: "删除二级 Tag", danger: true, action: () => this.deleteGroup(group)},
        ]);
    }

    entryMenu(event, group, entry) {
        showContextMenu(event, [
            {label: "编辑词条", action: () => this.editEntry(group, entry)},
            {label: "删除词条", danger: true, action: () => this.deleteEntry(group, entry)},
        ]);
    }

    openGroupChooser(event) {
        event.stopPropagation();
        const category = this.activeCategory();
        openSearchChooser(`选择 ${category.name} 的二级 Tag`, (category.children || []).map((group, index) => ({name: group.name, text: `${group.entries?.length || 0} 个词条`, index})), (item) => {
            this.activeGroupIndex = item.index;
            this.search = "";
            this.renderBody();
        });
    }

    async commitMutation(mutator, successText = "已保存") {
        const before = deepCopy(this.document);
        mutator();
        try {
            const payload = await requestJson("/elza/prompt-hub/documents/bank", {
                method: "POST",
                body: JSON.stringify({document: this.document, expected_revision: this.revision}),
            });
            this.document = deepCopy(payload.document);
            this.revision = payload.revision;
            await this.reloadDocuments();
            this.reconcileSelected();
            this.render();
            setStatus(this, successText, "ok");
            await refreshAffectedNodes("bank", this.document);
        } catch (error) {
            this.document = before;
            this.render();
            setStatus(this, `保存失败：${error.message}`, "error");
        }
    }

    async addCategory() {
        const values = await formDialog("新增一级 Tag", [{name: "name", label: "一级 Tag 名称"}]);
        if (!values) return;
        if (hasSiblingName(this.document.categories, values.name)) {
            setStatus(this, `当前词库已有一级 Tag“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => {
            this.document.categories.push({name: values.name, children: []});
            this.activeCategoryIndex = this.document.categories.length - 1;
            this.activeGroupIndex = 0;
        }, "一级 Tag 已新增并保存");
    }

    async renameCategory(category) {
        const values = await formDialog("一级 Tag 改名", [{name: "name", label: "一级 Tag 名称", value: category.name}]);
        if (!values || values.name === category.name) return;
        if (hasSiblingName(this.document.categories, values.name, category)) {
            setStatus(this, `当前词库已有一级 Tag“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => { category.name = values.name; }, "一级 Tag 已改名并保存");
    }

    async deleteCategory(category) {
        if (!await confirmDialog("删除一级 Tag", `确定删除“${category.name}”及其全部二级 Tag 和词条吗？工作流快照不会被删除。`)) return;
        await this.commitMutation(() => {
            this.document.categories.splice(this.document.categories.indexOf(category), 1);
            this.activeCategoryIndex = Math.max(0, Math.min(this.activeCategoryIndex, this.document.categories.length - 1));
            this.activeGroupIndex = 0;
        }, "一级 Tag 已删除；相关节点已刷新");
    }

    async addGroup(category) {
        const values = await formDialog("新增二级 Tag", [{name: "name", label: "二级 Tag 名称"}]);
        if (!values) return;
        if (hasSiblingName(category.children, values.name)) {
            setStatus(this, `当前一级 Tag 已有二级 Tag“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => {
            category.children.push({name: values.name, entries: []});
            this.activeCategoryIndex = this.document.categories.indexOf(category);
            this.activeGroupIndex = category.children.length - 1;
        }, "二级 Tag 已新增并保存");
    }

    async renameGroup(group) {
        const values = await formDialog("二级 Tag 改名", [{name: "name", label: "二级 Tag 名称", value: group.name}]);
        if (!values || values.name === group.name) return;
        const category = this.activeCategory();
        if (hasSiblingName(category?.children, values.name, group)) {
            setStatus(this, `当前一级 Tag 已有二级 Tag“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => { group.name = values.name; }, "二级 Tag 已改名并保存");
    }

    async deleteGroup(group) {
        if (!await confirmDialog("删除二级 Tag", `确定删除“${group.name}”及其全部词条吗？工作流快照不会被删除。`)) return;
        const category = this.activeCategory();
        await this.commitMutation(() => {
            category.children.splice(category.children.indexOf(group), 1);
            this.activeGroupIndex = Math.max(0, Math.min(this.activeGroupIndex, category.children.length - 1));
        }, "二级 Tag 已删除；相关节点已刷新");
    }

    async addEntry(group) {
        const values = await formDialog("新增词条", [
            {name: "name", label: "中文名称"},
            {name: "text", label: "Prompt 文本", multiline: true},
            {name: "aliases", label: "搜索别名（可选，逗号分隔）", required: false},
        ]);
        if (!values) return;
        if (hasSiblingName(group.entries, values.name)) {
            setStatus(this, `当前二级 Tag 已有中文名称“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => group.entries.push({
            name: values.name, text: values.text,
            aliases: values.aliases.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
        }), "词条已新增并保存");
    }

    async editEntry(group, entry) {
        const values = await formDialog("编辑词条", [
            {name: "name", label: "中文名称", value: entry.name},
            {name: "text", label: "Prompt 文本", value: entry.text, multiline: true},
            {name: "aliases", label: "搜索别名（可选，逗号分隔）", value: (entry.aliases || []).join(", "), required: false},
        ]);
        if (!values) return;
        if (hasSiblingName(group.entries, values.name, entry)) {
            setStatus(this, `当前二级 Tag 已有中文名称“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => Object.assign(entry, {
            name: values.name, text: values.text,
            aliases: values.aliases.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
        }), "词条已编辑并保存");
    }

    async deleteEntry(group, entry) {
        if (!await confirmDialog("删除词条", `确定删除“${entry.name}”吗？正在使用它的节点会刷新为橙色工作流保存值。`)) return;
        await this.commitMutation(() => group.entries.splice(group.entries.indexOf(entry), 1), "词条已删除；相关节点已刷新");
    }

    async saveBackup() {
        try {
            if (await backupKind("bank")) setStatus(this, "备份已保存到选择的位置", "ok");
        } catch (error) {
            setStatus(this, `备份失败：${error.message}`, "error");
        }
    }

    apply() {
        writeState(this.node, BANK_STATE, {
            version: 3,
            document_id: this.document.id,
            document_name: this.document.name,
            selected: this.selected.map((item) => ({
                name_snapshot: item.name_snapshot,
                text_snapshot: item.text_snapshot,
                source_path: item.source_path,
                weight: normalizeEntryWeight(item.weight),
                source_missing: Boolean(item.source_missing),
            })),
        });
        setWidgetValue(this.node, "text_display", this.selected.length
            ? this.selected.map((item) => item.text_snapshot).join(", ") : "(空)");
        this.close();
    }

    close() { this.overlay?.remove(); }
}

function normalizeMixState(rawState) {
    const state = rawState && typeof rawState === "object" ? deepCopy(rawState) : {};
    if (Array.isArray(state.sections)) {
        return {version: 3, document_id: String(state.document_id || state.recipe_id || ""), document_name: String(state.document_name || state.recipe_name || ""), document_missing: Boolean(state.document_missing), sections: state.sections};
    }
    const legacyGroups = Array.isArray(state.groups) ? state.groups : [];
    const groups = legacyGroups.map((group) => {
        const candidates = Array.isArray(group.candidates) ? group.candidates : [];
        const candidate = candidates.find((item) => String(item.id) === String(group.fixed_candidate_id))
            || candidates.find((item) => item.enabled !== false) || candidates[0] || null;
        return {name: String(group.name || "未命名混合项"), selected: candidate ? {name_snapshot: String(candidate.name || candidate.text || ""), text_snapshot: String(candidate.text || "")} : null};
    });
    return {version: 3, document_id: String(state.recipe_id || ""), document_name: String(state.recipe_name || ""), document_missing: false, sections: groups.length ? [{name: "旧版配方", collapsed: false, groups}] : []};
}

function mergeMixSections(document, savedState) {
    const savedSections = Array.isArray(savedState.sections) ? savedState.sections : [];
    const result = [];
    for (const [categoryIndex, category] of (document?.categories || []).entries()) {
        const savedSection = savedSections.find((item) => item.name === category.name);
        const groups = (category.children || []).map((group) => ({
            name: group.name,
            selected: savedSection?.groups?.find((item) => item.name === group.name)?.selected || null,
        }));
        for (const savedGroup of savedSection?.groups || []) {
            if (savedGroup?.selected && !groups.some((item) => item.name === savedGroup.name)) groups.push({...savedGroup, source_missing: true});
        }
        result.push({name: category.name, collapsed: savedSection ? Boolean(savedSection.collapsed) : true, groups});
    }
    for (const savedSection of savedSections) {
        if (!result.some((item) => item.name === savedSection.name)) {
            const groups = (savedSection.groups || []).filter((item) => item?.selected).map((item) => ({...item, source_missing: true}));
            if (groups.length) result.push({...savedSection, groups, source_missing: true});
        }
    }
    return result;
}

function compactMixState(state) {
    return {
        version: 3,
        document_id: String(state.document_id || ""),
        document_name: String(state.document_name || ""),
        document_missing: Boolean(state.document_missing),
        sections: (state.sections || []).map((section) => ({
            name: String(section.name || ""), collapsed: Boolean(section.collapsed),
            groups: (section.groups || []).map((group) => ({
                name: String(group.name || ""),
                selected: group.selected ? {name_snapshot: String(group.selected.name_snapshot || group.selected.name || ""), text_snapshot: String(group.selected.text_snapshot || group.selected.text || "")} : null,
            })),
        })),
    };
}

function libraryEntries(document, sectionName, groupName) {
    const category = (document?.categories || []).find((item) => item.name === sectionName);
    const group = (category?.children || []).find((item) => item.name === groupName);
    return Array.isArray(group?.entries) ? group.entries : [];
}

function openSearchChooser(title, entries, choose, selected = null) {
    const view = makeDialog(title, "compact");
    view.body.className = "elza-ph-chooser-list";
    const search = element("input", "elza-ph-input");
    search.placeholder = "输入中文或 Prompt 搜索";
    search.style.width = "100%";
    view.header.append(element("span", "elza-ph-spacer"), search, button("关闭", () => view.overlay.remove()));
    const render = () => {
        view.body.replaceChildren();
        const query = search.value.trim().toLowerCase();
        for (const entry of entries.filter((item) => !query || `${item.name} ${item.text || ""}`.toLowerCase().includes(query))) {
            const option = element("button", `elza-ph-option ${entry.saved ? "saved" : ""}`.trim());
            option.type = "button";
            option.append(element("div", "", entry.name), element("small", "", entry.text || ""));
            if (selected && entry.name === selected.name_snapshot && entry.text === selected.text_snapshot) option.classList.add("active");
            option.addEventListener("click", () => { choose(entry); view.overlay.remove(); });
            view.body.append(option);
        }
        if (!view.body.childElementCount) view.body.append(element("div", "elza-ph-empty", "没有符合条件的选项"));
    };
    search.addEventListener("input", render);
    render();
    search.focus();
}

function openMixChooser(panel, section, group) {
    const entries = libraryEntries(panel.document, section.name, group.name).map((item) => ({...item}));
    const selected = group.selected;
    const exact = selected && entries.some((item) => item.name === selected.name_snapshot && item.text === selected.text_snapshot);
    const options = [{name: "不使用", text: "不输出此混合项", none: true}];
    if (selected && !exact) options.push({name: `${selected.name_snapshot}（工作流保存值）`, text: selected.text_snapshot, saved: true, snapshot: selected});
    options.push(...entries);
    openSearchChooser(`${section.name} / ${group.name}`, options, (entry) => {
        group.selected = entry.none ? null : entry.snapshot || {name_snapshot: entry.name, text_snapshot: entry.text};
        panel.commit();
    }, selected);
}

class MixNodePanel {
    constructor(node, container) {
        this.node = node;
        this.container = container;
        this.state = normalizeMixState(readState(node, MIX_STATE, {}));
        this.document = null;
        this.documents = [];
        this.loading = false;
        this.resizeFrame = 0;
    }

    async reload(preferredDocumentId = "") {
        if (this.loading) return;
        this.loading = true;
        this.render("正在加载 Mixer 词库…");
        try {
            const list = await requestJson("/elza/prompt-hub/documents/mix");
            this.documents = list.documents || [];
            const hasSavedDocument = this.documents.some((item) => item.id === this.state.document_id);
            if (!preferredDocumentId && this.state.document_id && !hasSavedDocument) {
                this.document = null;
                this.state.document_missing = true;
                this.commit(false);
                this.render(`当前 Mixer 词库“${this.state.document_name || this.state.document_id}”已删除或无法读取；工作流快照仍会继续输出。`);
                return;
            }
            const target = preferredDocumentId || (hasSavedDocument ? this.state.document_id : "") || this.documents[0]?.id;
            if (!target) throw new Error("没有可用的 Mixer 词库");
            const payload = await requestJson(`/elza/prompt-hub/documents/mix/${encodeURIComponent(target)}`);
            this.document = payload.document;
            this.state.document_id = this.document.id;
            this.state.document_name = this.document.name;
            this.state.document_missing = false;
            this.state.sections = mergeMixSections(this.document, this.state);
            this.commit(false);
            this.render();
        } catch (error) {
            this.document = null;
            this.render(`词库加载失败：${error.message}`);
        } finally {
            this.loading = false;
        }
    }

    restore() { this.state = normalizeMixState(readState(this.node, MIX_STATE, {})); return this.reload(); }
    commit(render = true) { this.state = compactMixState(this.state); writeState(this.node, MIX_STATE, this.state); if (render) this.render(); }

    markDocumentMissing(documentId) {
        if (this.state.document_id !== documentId) return;
        this.document = null;
        this.state.document_missing = true;
        this.commit(false);
        this.render(`当前 Mixer 词库“${this.state.document_name || documentId}”已删除；工作流快照仍会继续输出。`);
    }

    resize() {
        cancelAnimationFrame(this.resizeFrame);
        this.resizeFrame = requestAnimationFrame(() => {
            if (!this.node?.setSize) return;
            const sectionCount = Math.max(1, this.state.sections?.length || 0);
            const expandedGroupCount = (this.state.sections || []).reduce(
                (total, section) => total + (section.collapsed ? 0 : (section.groups?.length || 0)),
                0,
            );
            const targetHeight = Math.min(
                620,
                Math.max(230, 196 + sectionCount * 34 + expandedGroupCount * 38),
            );
            this.node.setSize([Math.max(this.node.size?.[0] || 0, 360), targetHeight]);
            this.node.graph?.setDirtyCanvas?.(true, true);
        });
    }

    render(statusText = "") {
        this.container.replaceChildren();
        const tools = element("div", "elza-mix-node-tools");
        const documentSelect = element("select", "elza-mix-node-select");
        if (this.state.document_id && !this.documents.some((item) => item.id === this.state.document_id)) {
            const missingOption = element("option", "", `${this.state.document_name || this.state.document_id}（已丢失）`);
            missingOption.value = this.state.document_id;
            missingOption.selected = true;
            documentSelect.append(missingOption);
        }
        for (const item of this.documents) {
            const option = element("option", "", item.name);
            option.value = item.id;
            option.selected = item.id === this.state.document_id;
            documentSelect.append(option);
        }
        documentSelect.disabled = this.loading || !documentSelect.options.length;
        documentSelect.title = "选择当前 Mixer YAML 词库";
        documentSelect.addEventListener("change", () => this.reload(documentSelect.value));
        tools.append(
            documentSelect,
            button("全部展开", () => { for (const section of this.state.sections) section.collapsed = false; this.commit(); }),
            button("全部收起", () => { for (const section of this.state.sections) section.collapsed = true; this.commit(); }),
            button("刷新词库", () => this.reload()),
            button("管理词库", () => new MixDialog(this.node).open()),
        );
        this.container.append(tools);
        this.container.append(element("div", "elza-mix-node-status", statusText || this.state.document_name || "未选择词库"));
        if (!this.document) {
            this.container.append(element("div", "elza-ph-empty", statusText || "正在加载 Mixer 词库…"));
            return;
        }
        for (const section of this.state.sections || []) {
            const wrapper = element("div", "elza-mix-section");
            const head = element("button", "elza-mix-section-head");
            head.type = "button";
            head.append(element("span", "", `${section.collapsed ? "▶" : "▼"} ${section.name}`), element("span", "elza-ph-muted", `${(section.groups || []).filter((item) => item.selected).length}/${section.groups?.length || 0}`));
            head.addEventListener("click", () => { section.collapsed = !section.collapsed; this.commit(); });
            wrapper.append(head);
            if (!section.collapsed) {
                const body = element("div", "elza-mix-section-body");
                for (const group of section.groups || []) {
                    const entries = libraryEntries(this.document, section.name, group.name);
                    const exact = group.selected && entries.some((item) => item.name === group.selected.name_snapshot && item.text === group.selected.text_snapshot);
                    const row = element("div", "elza-mix-row");
                    const label = element("div", "elza-mix-row-label", group.name);
                    label.title = group.name;
                    const choice = element("button", `elza-mix-choice ${group.selected && !exact ? "saved" : ""}`.trim(), group.selected ? `${group.selected.name_snapshot}${exact ? "" : "（工作流保存）"}` : "不使用");
                    choice.type = "button";
                    choice.title = group.selected?.text_snapshot || "不输出此混合项";
                    choice.addEventListener("click", () => openMixChooser(this, section, group));
                    row.append(label, choice, group.selected ? button("×", () => { group.selected = null; this.commit(); }, "elza-mix-clear") : element("span"));
                    body.append(row);
                }
                wrapper.append(body);
            }
            this.container.append(wrapper);
        }
        this.resize();
    }
}

class MixDialog {
    constructor(node) {
        this.node = node;
        this.state = normalizeMixState(readState(node, MIX_STATE, {}));
        this.documents = [];
        this.search = "";
        this.activeCategoryIndex = 0;
    }

    async open() {
        Object.assign(this, makeDialog("Prompt Mixer 词库"));
        this.status = element("span", "elza-ph-status", "正在载入词库…");
        this.footer.append(this.status);
        try {
            await this.reloadDocuments();
            const target = this.documents.some((item) => item.id === this.state.document_id) ? this.state.document_id : this.documents[0]?.id;
            await this.loadDocument(target);
        } catch (error) { setStatus(this, error.message, "error"); }
    }

    async reloadDocuments() { this.documents = (await requestJson("/elza/prompt-hub/documents/mix")).documents || []; }
    async loadDocument(documentId) {
        if (!documentId) return;
        const payload = await requestJson(`/elza/prompt-hub/documents/mix/${encodeURIComponent(documentId)}`);
        this.document = deepCopy(payload.document);
        this.revision = payload.revision;
        this.activeCategoryIndex = Math.min(this.activeCategoryIndex, Math.max(0, this.document.categories.length - 1));
        this.render();
    }
    activeCategory() { return this.document?.categories?.[this.activeCategoryIndex]; }

    render() { this.renderHeader(); this.renderBody(); this.renderFooter(); }
    renderHeader() {
        this.header.replaceChildren(element("div", "elza-ph-title", "Prompt Mixer 词库"));
        const select = element("select", "elza-ph-select");
        for (const item of this.documents) {
            const option = element("option", "", item.name);
            option.value = item.id; option.selected = item.id === this.document?.id; select.append(option);
        }
        select.addEventListener("change", () => this.loadDocument(select.value));
        const search = element("input", "elza-ph-input elza-ph-search");
        search.placeholder = "搜索混合项或候选词组"; search.value = this.search;
        search.addEventListener("input", () => { this.search = search.value.trim().toLowerCase(); this.renderBody(); });
        this.header.append(select, search, element("span", "elza-ph-spacer"), button("文件管理", () => new FileManager(this, "mix").open()), button("打开文件夹", () => openDocumentFolder("mix", this.document?.id, this)), button("另存备份", () => this.saveBackup()), button("关闭", () => this.close()));
    }

    renderBody() {
        this.body.className = "elza-ph-body mixer";
        this.body.replaceChildren();
        const left = element("div", "elza-ph-column");
        const middle = element("div", "elza-ph-column");
        this.body.append(left, middle);
        const leftTitle = element("div", "elza-ph-section-title");
        leftTitle.append(element("span", "", "一级分组"), element("span", "elza-ph-spacer"), button("＋", () => this.addCategory(), "elza-ph-mini"));
        left.append(leftTitle);
        const list = element("div", "elza-ph-list");
        for (const [index, category] of (this.document?.categories || []).entries()) {
            const row = element("div", `elza-ph-row ${index === this.activeCategoryIndex ? "active" : ""}`);
            const line = element("div", "elza-ph-row-line");
            line.append(element("span", "", category.name), button("···", (event) => this.categoryMenu(event, category), "elza-ph-mini ghost"));
            row.append(line, element("div", "elza-ph-source", `${category.children?.length || 0} 个混合项`));
            row.addEventListener("click", () => { this.activeCategoryIndex = index; this.renderBody(); });
            row.addEventListener("contextmenu", (event) => this.categoryMenu(event, category));
            list.append(row);
        }
        if (!list.childElementCount) list.append(element("div", "elza-ph-empty", "点击 ＋ 新建一级分组"));
        left.append(list);

        const category = this.activeCategory();
        const title = element("div", "elza-ph-section-title");
        title.append(element("span", "", category?.name || "二级混合项"), element("span", "elza-ph-spacer"));
        if (category) title.append(button("＋ 新建混合项", () => this.addGroup(category), "elza-ph-mini"));
        middle.append(title);
        const grid = element("div", "elza-ph-container-grid");
        const groups = (category?.children || []).filter((group) => {
            const haystack = `${group.name} ${(group.entries || []).map((entry) => `${entry.name} ${entry.text}`).join(" ")}`.toLowerCase();
            return !this.search || haystack.includes(this.search);
        });
        for (const group of groups) {
            const card = element("div", "elza-ph-card");
            const head = element("div", "elza-ph-card-head");
            head.append(element("div", "elza-ph-card-title", group.name), element("span", "elza-ph-count", `${group.entries?.length || 0} 项`));
            card.append(head);
            const previews = (group.entries || []).slice(0, 3);
            card.append(element("div", "elza-ph-card-text", previews.length ? previews.map((entry) => entry.name).join("、") : "点击添加候选词组"));
            if ((group.entries?.length || 0) > 3) card.append(element("div", "elza-ph-source", `还有 ${group.entries.length - 3} 项`));
            card.addEventListener("click", () => new CandidateEditor(this, group).open());
            card.addEventListener("contextmenu", (event) => this.groupMenu(event, group));
            grid.append(card);
        }
        if (!grid.childElementCount) grid.append(element("div", "elza-ph-empty", category ? "当前一级分组没有混合项" : "请先新建一级分组"));
        middle.append(grid);
    }

    renderFooter() {
        this.footer.replaceChildren();
        this.status = element("span", "elza-ph-status", "点击混合项卡片管理候选词组；每次增删改都会立即保存");
        this.footer.append(this.status, button("关闭", () => this.close()));
    }

    categoryMenu(event, category) { showContextMenu(event, [
        {label: "新增混合项", action: () => this.addGroup(category)},
        {label: "一级分组改名", action: () => this.renameCategory(category)},
        {label: "删除一级分组", danger: true, action: () => this.deleteCategory(category)},
    ]); }
    groupMenu(event, group) { showContextMenu(event, [
        {label: "管理候选词组", action: () => new CandidateEditor(this, group).open()},
        {label: "混合项改名", action: () => this.renameGroup(group)},
        {label: "删除混合项", danger: true, action: () => this.deleteGroup(group)},
    ]); }

    async commitMutation(mutator, successText = "已保存") {
        const before = deepCopy(this.document);
        mutator();
        try {
            const payload = await requestJson("/elza/prompt-hub/documents/mix", {method: "POST", body: JSON.stringify({document: this.document, expected_revision: this.revision})});
            this.document = deepCopy(payload.document); this.revision = payload.revision;
            await this.reloadDocuments(); this.render(); setStatus(this, successText, "ok");
            await refreshAffectedNodes("mix", this.document);
            return true;
        } catch (error) {
            this.document = before; this.render(); setStatus(this, `保存失败：${error.message}`, "error"); return false;
        }
    }

    async addCategory() {
        const values = await formDialog("新增一级分组", [{name: "name", label: "一级分组名称"}]);
        if (!values) return;
        if (hasSiblingName(this.document.categories, values.name)) {
            setStatus(this, `当前词库已有一级分组“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => { this.document.categories.push({name: values.name, children: []}); this.activeCategoryIndex = this.document.categories.length - 1; }, "一级分组已新增并保存");
    }
    async renameCategory(category) {
        const values = await formDialog("一级分组改名", [{name: "name", label: "一级分组名称", value: category.name}]);
        if (!values || values.name === category.name) return;
        if (hasSiblingName(this.document.categories, values.name, category)) {
            setStatus(this, `当前词库已有一级分组“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => { category.name = values.name; }, "一级分组已改名并保存");
    }
    async deleteCategory(category) {
        if (!await confirmDialog("删除一级分组", `确定删除“${category.name}”及其全部混合项吗？工作流快照不会被删除。`)) return;
        await this.commitMutation(() => { this.document.categories.splice(this.document.categories.indexOf(category), 1); this.activeCategoryIndex = Math.max(0, Math.min(this.activeCategoryIndex, this.document.categories.length - 1)); }, "一级分组已删除；相关节点已刷新");
    }
    async addGroup(category) {
        const values = await formDialog("新增混合项", [{name: "name", label: "混合项名称", help: "蓝图节点会把它显示为一行可搜索单选项。"}]);
        if (!values) return;
        if (hasSiblingName(category.children, values.name)) {
            setStatus(this, `当前一级分组已有混合项“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => category.children.push({name: values.name, entries: []}), "混合项已新增并保存");
    }
    async renameGroup(group) {
        const values = await formDialog("混合项改名", [{name: "name", label: "混合项名称", value: group.name}]);
        if (!values || values.name === group.name) return;
        const category = this.activeCategory();
        if (hasSiblingName(category?.children, values.name, group)) {
            setStatus(this, `当前一级分组已有混合项“${values.name}”`, "error");
            return;
        }
        await this.commitMutation(() => { group.name = values.name; }, "混合项已改名并保存");
    }
    async deleteGroup(group) {
        if (!await confirmDialog("删除混合项", `确定删除“${group.name}”及其全部候选词组吗？工作流快照不会被删除。`)) return;
        const category = this.activeCategory();
        await this.commitMutation(() => category.children.splice(category.children.indexOf(group), 1), "混合项已删除；相关节点已刷新");
    }
    async saveBackup() { try { if (await backupKind("mix")) setStatus(this, "备份已保存到选择的位置", "ok"); } catch (error) { setStatus(this, `备份失败：${error.message}`, "error"); } }
    close() { this.overlay?.remove(); }
}

class CandidateEditor {
    constructor(owner, group) { this.owner = owner; this.groupName = group.name; this.search = ""; }
    currentGroup() { return this.owner.activeCategory()?.children?.find((item) => item.name === this.groupName); }
    open() {
        Object.assign(this, makeDialog(`候选词组 · ${this.groupName}`, "candidate-editor"));
        this.body.className = "elza-ph-candidate-list";
        const search = element("input", "elza-ph-input elza-ph-search");
        search.placeholder = "搜索中文名称或 Prompt";
        search.value = this.search;
        search.addEventListener("input", () => { this.search = search.value.trim().toLowerCase(); this.render(); });
        this.header.append(search, element("span", "elza-ph-spacer"), button("＋ 候选词组", () => this.add(), "primary"));
        this.footer.append(element("span", "elza-ph-status", "中文名称用于选择，英文 Prompt 用于实际输出"), button("关闭", () => { this.overlay.remove(); this.owner.renderBody(); }));
        this.render();
    }
    render() {
        this.body.replaceChildren();
        const group = this.currentGroup();
        const query = this.search;
        const entries = (group?.entries || []).filter((entry) => !query || `${entry.name} ${entry.text}`.toLowerCase().includes(query));
        for (const entry of entries) {
            const row = element("div", "elza-ph-candidate");
            const content = element("div");
            content.append(element("div", "elza-ph-card-title", entry.name), element("div", "elza-ph-card-text", entry.text));
            const actions = element("div", "elza-ph-candidate-actions");
            actions.append(button("编辑", () => this.edit(entry), "elza-ph-mini"), button("删除", () => this.remove(entry), "elza-ph-mini danger"));
            row.append(content, actions); this.body.append(row);
        }
        if (!this.body.childElementCount) this.body.append(element("div", "elza-ph-empty", query ? "没有符合条件的候选词组" : "当前混合项没有候选词组"));
    }
    async add() {
        const values = await formDialog("新增候选词组", [{name: "name", label: "中文名称"}, {name: "text", label: "英文 Prompt（可为一整组词）", multiline: true}]);
        if (!values) return;
        const group = this.currentGroup();
        if (hasSiblingName(group.entries, values.name)) { await formDialog("名称重复", [{name: "message", label: "提示", value: `当前混合项已存在“${values.name}”`, required: false}], "关闭"); return; }
        if (await this.owner.commitMutation(() => group.entries.push({name: values.name, text: values.text}), "候选词组已新增并保存")) this.render();
    }
    async edit(entry) {
        const values = await formDialog("编辑候选词组", [{name: "name", label: "中文名称", value: entry.name}, {name: "text", label: "英文 Prompt（可为一整组词）", value: entry.text, multiline: true}]);
        if (!values) return;
        const group = this.currentGroup();
        if (hasSiblingName(group.entries, values.name, entry)) { await formDialog("名称重复", [{name: "message", label: "提示", value: `当前混合项已存在“${values.name}”`, required: false}], "关闭"); return; }
        if (await this.owner.commitMutation(() => Object.assign(entry, values), "候选词组已编辑并保存")) this.render();
    }
    async remove(entry) {
        if (!await confirmDialog("删除候选词组", `确定删除“${entry.name}”吗？已使用它的节点会保留工作流保存值。`)) return;
        const group = this.currentGroup();
        if (await this.owner.commitMutation(() => group.entries.splice(group.entries.indexOf(entry), 1), "候选词组已删除；相关节点已刷新")) this.render();
    }
}

function makeReadOnly(widget) {
    if (!widget) return;
    widget.readOnly = true; widget.disabled = true;
    const input = widget.inputEl || widget.element;
    if (input) { input.readOnly = true; input.style.opacity = "0.78"; input.style.background = "rgba(0,0,0,.18)"; input.style.borderStyle = "dashed"; }
}

function formatProbabilityAnalysis(analysis) {
    if (!analysis.has_random_syntax) return "未检测到随机语法；当前文本会 100% 原样输出。";
    const lines = [];
    for (const block of analysis.blocks) {
        lines.push(`随机块 ${block.index}  ${block.source}`);
        for (const option of block.options) lines.push(`  ${option.text === "" ? "(空选项)" : option.text}: ${block.approximate ? "约 " : ""}${(option.probability * 100).toFixed(2)}%`);
    }
    return lines.join("\n");
}

function setupRandomProbability(node) {
    if (node._elzaProbabilitySetup) { node._elzaProbabilityRefresh?.(); return; }
    node._elzaProbabilitySetup = true;
    const promptWidget = getWidget(node, "prompt");
    makeReadOnly(getWidget(node, "probability_display"));
    let timer = null;
    let requestVersion = 0;
    const refresh = () => {
        clearTimeout(timer);
        const currentVersion = ++requestVersion;
        timer = setTimeout(async () => {
            try {
                const payload = await requestJson("/elza/prompt-hub/syntax/probabilities", {method: "POST", body: JSON.stringify({text: String(promptWidget?.value || "")})});
                if (currentVersion !== requestVersion) return;
                setWidgetValue(node, "probability_display", formatProbabilityAnalysis(payload.analysis));
            } catch (error) {
                if (currentVersion !== requestVersion) return;
                setWidgetValue(node, "probability_display", `语法错误：${error.message}`);
            }
        }, 120);
    };
    const original = promptWidget?.callback;
    if (promptWidget) promptWidget.callback = function () { const result = original?.apply(this, arguments); refresh(); return result; };
    node._elzaProbabilityRefresh = refresh;
    node._elzaRandomCleanup = () => { requestVersion += 1; clearTimeout(timer); };
    refresh();
}

function setupMixNode(node) {
    if (node._elzaMixPanel) { node._elzaMixPanel.restore(); return; }
    const container = element("div", "elza-mix-node");
    const panel = new MixNodePanel(node, container);
    node._elzaMixPanel = panel;
    node._elzaMixReload = (documentId = "") => panel.reload(documentId);
    if (typeof node.addDOMWidget === "function") {
        container.addEventListener("wheel", (event) => {
            if (container.scrollHeight > container.clientHeight) event.stopPropagation();
        }, {passive: true});
        node._elzaMixWidget = node.addDOMWidget("mixer_selector", "elza-mixer", container, {serialize: false, getMinHeight: () => 90, getMaxHeight: () => 520, hideOnZoom: false});
        panel.reload();
    } else {
        node.addWidget("button", "管理 Mixer 词库", null, () => new MixDialog(node).open());
        node.addWidget("button", "刷新词库", null, () => panel.reload());
    }
}

app.registerExtension({
    name: "Elza.PromptHub.BankMixRandom.V3",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (![BANK_NODE, MIX_NODE, RANDOM_NODE, RESOLUTION_NODE].includes(nodeData.name)) return;
        const originalCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = originalCreated?.apply(this, arguments);
            if (nodeData.name === BANK_NODE) {
                makeReadOnly(getWidget(this, "text_display"));
                this.addWidget("button", "打开 Prompt Bank", null, () => new BankDialog(this).open());
                this.addWidget("button", "另存词库备份", null, async () => { try { await backupKind("bank"); } catch (error) { console.error("[Elza Prompt Hub] 备份失败", error); } });
            } else if (nodeData.name === MIX_NODE) {
                const weight = getWidget(this, "final_weight");
                if (weight && !Number.isFinite(Number(weight.value))) weight.value = 1;
                setupMixNode(this);
            } else if (nodeData.name === RESOLUTION_NODE) {
                setupResolutionNode(this);
            } else setupRandomProbability(this);
            return result;
        };
        const originalConfigured = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
            const configureArguments = [...arguments];
            if (nodeData.name === MIX_NODE && Array.isArray(configureArguments[0]?.widgets_values) && configureArguments[0].widgets_values.length > 1) configureArguments[0] = {...configureArguments[0], widgets_values: [1]};
            if (nodeData.name === RESOLUTION_NODE && Array.isArray(configureArguments[0]?.widgets_values)) {
                const values = configureArguments[0].widgets_values;
                const oldLayout = String(values[0]).endsWith("级")
                    || (values[0] === "自定义" && Boolean(RESOLUTION_RATIOS[values[1]]));
                if (values.length >= 4 && oldLayout) {
                    const oldPreset = String(values[0]);
                    const oldAspect = values[1] || "1:1";
                    let oldWidth = Number(values[2]) || 1024;
                    let oldHeight = Number(values[3]) || 1024;
                    if (values[4] === true) [oldWidth, oldHeight] = [oldHeight, oldWidth];
                    configureArguments[0] = {...configureArguments[0], widgets_values: [oldPreset === "自定义" ? "自定义" : "常用尺寸", oldPreset === "自定义" ? "1024级" : oldPreset, oldAspect, oldWidth, oldHeight, 1]};
                }
            }
            const result = originalConfigured?.apply(this, configureArguments);
            if (nodeData.name === BANK_NODE) makeReadOnly(getWidget(this, "text_display"));
            if (nodeData.name === MIX_NODE) { const weight = getWidget(this, "final_weight"); if (weight && !Number.isFinite(Number(weight.value))) weight.value = 1; setupMixNode(this); }
            if (nodeData.name === RESOLUTION_NODE) setupResolutionNode(this);
            if (nodeData.name === RANDOM_NODE) setupRandomProbability(this);
            return result;
        };
        const originalRemoved = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function () { this._elzaRandomCleanup?.(); return originalRemoved?.apply(this, arguments); };
    },
});
