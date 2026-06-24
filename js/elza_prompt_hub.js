import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

const MAX_PROMPTS = 99;

// ==================================================================
//  Prompt Bank — 样式
// ==================================================================
const _BANK_STYLES = `
.elza-wb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);
    display:flex;align-items:center;justify-content:center;z-index:9999;}
.elza-wb-dialog{background:#1a1a1a;border:1px solid #444;border-radius:10px;
    width:1100px;height:700px;display:flex;flex-direction:column;color:#ddd;
    font-size:14px;box-shadow:0 8px 40px rgba(0,0,0,.6);user-select:none;}
.elza-wb-header{display:flex;align-items:center;padding:10px 16px;
    border-bottom:1px solid #333;gap:12px;}
.elza-wb-header .elza-wb-title{font-size:16px;font-weight:bold;}
.elza-wb-header .elza-wb-subtitle{color:#888;font-size:12px;margin-left:auto;}
.elza-wb-header .elza-wb-close{background:none;border:none;color:#aaa;
    font-size:18px;cursor:pointer;padding:0 4px;}
.elza-wb-header .elza-wb-close:hover{color:#f55;}

.elza-wb-body{display:flex;flex:1;overflow:hidden;}

/* 左栏 */
.elza-wb-left{width:200px;border-right:1px solid #333;display:flex;
    flex-direction:column;padding:8px;gap:6px;}
.elza-wb-left .elza-wb-btns{display:flex;gap:4px;}
.elza-wb-left .elza-wb-btns button{flex:1;padding:5px 0;border:1px solid #444;
    background:#2a2a2a;color:#aaa;border-radius:4px;cursor:pointer;font-size:12px;}
.elza-wb-left .elza-wb-btns button:disabled{color:#555;cursor:not-allowed;}
.elza-wb-tree{flex:1;overflow-y:auto;}
.elza-wb-tree .elza-cat-item{padding:6px 8px;cursor:pointer;border-radius:4px;
    display:flex;align-items:center;gap:4px;font-size:14px;}
.elza-wb-tree .elza-cat-item:hover{background:#2a2a2a;}
.elza-wb-tree .elza-cat-item.selected{background:#3a5a8a;}
.elza-wb-tree .elza-cat-item .elza-arrow{font-size:10px;width:14px;color:#888;}
.elza-wb-tree .elza-sub-item{padding-left:20px;font-size:13px;margin-top:1px;
    border-left:2px solid #333;margin-left:14px;border-radius:0 4px 4px 0;}

/* 中栏 */
.elza-wb-middle{flex:1;padding:8px;overflow-y:auto;display:grid;
    grid-template-columns:repeat(6, 1fr);gap:8px;align-content:flex-start;}
.elza-wb-middle .elza-tag-item{padding:6px;background:#2a2a2a;
    border:1px solid #444;border-radius:6px;cursor:pointer;
    display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
    height:70px;overflow:hidden;word-break:break-word;}
.elza-wb-middle .elza-tag-item:hover{background:#3a3a3a;}
.elza-wb-middle .elza-tag-item.selected{background:#3a5a8a;border-color:#5a8aca;}
.elza-wb-middle .elza-tag-item .elza-tag-en{font-size:13px;line-height:1.2;
    display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;}
.elza-wb-middle .elza-tag-item .elza-tag-zh{font-size:11px;color:#888;margin-top:4px;line-height:1.2;
    display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;}
.elza-wb-middle .elza-tag-item.elza-small-text .elza-tag-en{font-size:11px;}
.elza-wb-middle .elza-tag-item.elza-small-text .elza-tag-zh{font-size:10px;}

/* 右栏 */
.elza-wb-right{width:240px;border-left:1px solid #333;padding:8px;
    display:flex;flex-direction:column;gap:6px;}
.elza-wb-right .elza-selected-title{font-size:13px;color:#aaa;}
.elza-wb-right .elza-selected-list{flex:1;overflow-y:auto;
    display:flex;flex-direction:column;gap:6px;align-content:flex-start;}
.elza-wb-right .elza-sel-tag{display:flex;align-items:center;
    background:#2a3a2a;border:1px solid #3a5a3a;border-radius:6px;
    padding:6px;gap:6px;height:fit-content;word-break:break-word;}
.elza-wb-right .elza-sel-tag .elza-sel-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.elza-wb-right .elza-sel-tag .elza-sel-en{font-size:12px;line-height:1.2;}
.elza-wb-right .elza-sel-tag .elza-sel-zh{font-size:11px;color:#888;line-height:1.2;}
.elza-wb-right .elza-sel-tag .elza-sel-x{cursor:pointer;color:#888;
    font-size:16px;line-height:1;padding:0 4px;flex-shrink:0;}
.elza-wb-right .elza-sel-tag .elza-sel-x:hover{color:#f55;}

/* 表单面板 */
.elza-wb-form-mask{position:absolute;inset:0;background:rgba(0,0,0,.5);
    display:flex;align-items:center;justify-content:center;z-index:10;
    border-radius:10px;}
.elza-wb-form-panel{background:#252525;border:1px solid #555;border-radius:8px;
    padding:16px 20px;min-width:280px;display:flex;flex-direction:column;gap:10px;}
.elza-wb-form-panel .elza-form-title{font-size:15px;font-weight:bold;}
.elza-wb-form-panel label{font-size:13px;color:#bbb;display:flex;
    flex-direction:column;gap:4px;}
.elza-wb-form-panel input{padding:6px 10px;background:#1a1a1a;border:1px solid #444;
    border-radius:4px;color:#ddd;font-size:14px;outline:none;}
.elza-wb-form-panel input:focus{border-color:#5a8aca;}
.elza-wb-form-panel .elza-form-hint{font-size:11px;color:#666;}
.elza-wb-form-panel .elza-form-btns{display:flex;gap:8px;justify-content:flex-end;}
.elza-wb-form-panel .elza-form-btns button{padding:5px 20px;border:1px solid #444;
    border-radius:4px;background:#2a2a2a;color:#ddd;cursor:pointer;font-size:13px;}
.elza-wb-form-panel .elza-form-btns button.elza-form-ok{background:#3a5a8a;border-color:#5a8aca;}
.elza-wb-form-panel .elza-form-btns button:hover{background:#444;}

/* loading */
.elza-wb-loading{position:absolute;inset:0;background:rgba(0,0,0,.5);
    display:flex;align-items:center;justify-content:center;z-index:20;
    border-radius:10px;font-size:16px;color:#ddd;}
.elza-wb-loading .elza-spinner{width:24px;height:24px;border:3px solid #555;
    border-top-color:#5a8aca;border-radius:50%;animation:elza-spin .6s linear infinite;
    margin-right:10px;}
@keyframes elza-spin{to{transform:rotate(360deg);}}

/* 底部 */
.elza-wb-footer{display:flex;justify-content:flex-end;gap:10px;
    padding:10px 16px;border-top:1px solid #333;}
.elza-wb-footer button{padding:6px 28px;border:1px solid #444;border-radius:6px;
    background:#2a2a2a;color:#ddd;cursor:pointer;font-size:14px;}
.elza-wb-footer button.elza-confirm{background:#3a5a8a;border-color:#5a8aca;}
.elza-wb-footer button:hover{background:#444;}

/* 右键菜单 */
.elza-wb-ctxmenu{position:fixed;background:#222;border:1px solid #555;
    border-radius:6px;padding:4px 0;z-index:99999;min-width:100px;}
.elza-wb-ctxmenu .elza-ctx-item{padding:6px 16px;cursor:pointer;font-size:13px;}
.elza-wb-ctxmenu .elza-ctx-item:hover{background:#3a5a8a;}
`;

// ==================================================================
//  Prompt Bank — HTML 骨架
// ==================================================================
const _BANK_HTML = `
<div class="elza-wb-overlay">
  <div class="elza-wb-dialog">
    <div class="elza-wb-header">
      <span class="elza-wb-title">📚 词库</span>
      <span class="elza-wb-subtitle">Elza Prompt Bank</span>
      <button class="elza-wb-close">✕</button>
    </div>
    <div class="elza-wb-body">
      <div class="elza-wb-left">
        <div class="elza-wb-btns">
          <button data-action="add-cat1">+一级</button>
          <button data-action="add-cat2" disabled>+二级</button>
          <button data-action="add-tag" disabled>+tag</button>
        </div>
        <div class="elza-wb-tree"></div>
      </div>
      <div class="elza-wb-middle"></div>
      <div class="elza-wb-right">
        <span class="elza-selected-title">已选 (0)</span>
        <div class="elza-selected-list"></div>
      </div>
    </div>
    <div class="elza-wb-footer">
      <button class="elza-cancel">取消</button>
      <button class="elza-confirm">确认</button>
    </div>
  </div>
</div>`;

// ==================================================================
//  Dialog 单例
// ==================================================================
let _bankInst = null;

class ElzaWordBankDialog {
    constructor(node) {
        if (_bankInst) _bankInst.destroy();
        _bankInst = this;
        this.node = node;
        this.data = {};
        this.selectedTags = [];   // [{zh, en}]
        this.selCat1 = null;
        this.selCat2 = null;
        this.modified = false;
        this._ctxMenu = null;
        this._saving = false;

        // 注入样式
        if (!document.getElementById("elza-wb-styles")) {
            const s = document.createElement("style");
            s.id = "elza-wb-styles";
            s.textContent = _BANK_STYLES;
            document.head.appendChild(s);
        }

        this._build();
        this._bind();

        // 读取已有 tags
        if (this.node.properties && this.node.properties.elza_selected_tags) {
            try {
                const parsed = JSON.parse(this.node.properties.elza_selected_tags);
                if (Array.isArray(parsed)) {
                    this.selectedTags = parsed;
                }
            } catch (e) {
                console.error("解析 elza_selected_tags 失败", e);
            }
        }

        this._load();
    }

    // ── DOM ──────────────────────────────────────────────
    _build() {
        const tpl = document.createElement("div");
        tpl.innerHTML = _BANK_HTML.trim();
        this._overlay = tpl.firstChild;
        document.body.appendChild(this._overlay);

        const d = this._overlay.querySelector(".elza-wb-dialog");
        this._treeEl = d.querySelector(".elza-wb-tree");
        this._midEl = d.querySelector(".elza-wb-middle");
        this._selTitle = d.querySelector(".elza-selected-title");
        this._selList = d.querySelector(".elza-selected-list");
        this._btnCat1 = d.querySelector("[data-action='add-cat1']");
        this._btnCat2 = d.querySelector("[data-action='add-cat2']");
        this._btnTag = d.querySelector("[data-action='add-tag']");
        this._dialogEl = d;
    }

    _bind() {
        this._overlay.querySelector(".elza-wb-close").onclick = () => this.cancel();
        this._overlay.querySelector(".elza-cancel").onclick = () => this.cancel();
        this._overlay.querySelector(".elza-confirm").onclick = () => this.confirm();
        this._overlay.addEventListener("click", (e) => {
            if (e.target === this._overlay) this.cancel();
        });

        // 分类按钮
        this._btnCat1.onclick = () => this._showCatForm(null);
        this._btnCat2.onclick = () => {
            if (!this.selCat1) return;
            this._showCatForm(this.selCat1);
        };
        this._btnTag.onclick = () => {
            if (!this.selCat1 || !this.selCat2) return;
            this._showTagForm(null);
        };

        document.addEventListener("click", () => this._hideCtxMenu());
    }

    // ── Loading ──────────────────────────────────────────
    _showLoading(msg) {
        this._hideLoading();
        const div = document.createElement("div");
        div.className = "elza-wb-loading";
        div.id = "elza-wb-loading";
        div.innerHTML = `<span class="elza-spinner"></span>${msg || "保存中..."}`;
        this._dialogEl.appendChild(div);
    }
    _hideLoading() {
        const el = document.getElementById("elza-wb-loading");
        if (el) el.remove();
    }

    // ── 表单面板 ─────────────────────────────────────────
    _showForm(title, fields, onOk) {
        // fields: [{label, value, maxlength, placeholder}]
        this._hideForm();
        const mask = document.createElement("div");
        mask.className = "elza-wb-form-mask";
        mask.id = "elza-wb-form";

        let fieldsHtml = "";
        for (const f of fields) {
            fieldsHtml += `<label>${f.label}
              <input type="text" value="${f.value || ""}" maxlength="${f.maxlength || 100}"
                placeholder="${f.placeholder || ""}" data-field="${f.label}">
              <span class="elza-form-hint">最多 ${f.maxlength || 100} 字符</span>
            </label>`;
        }

        mask.innerHTML = `<div class="elza-wb-form-panel">
          <span class="elza-form-title">${title}</span>
          ${fieldsHtml}
          <div class="elza-form-btns">
            <button class="elza-form-cancel">取消</button>
            <button class="elza-form-ok">确定</button>
          </div>
        </div>`;

        mask.querySelector(".elza-form-cancel").onclick = () => this._hideForm();
        mask.querySelector(".elza-form-ok").onclick = () => {
            const inputs = mask.querySelectorAll("input");
            const values = {};
            for (const inp of inputs) {
                const v = inp.value.trim();
                values[inp.dataset.field] = v;
            }
            // 校验非空
            for (const f of fields) {
                if (!values[f.label]) { alert(`${f.label} 不能为空`); return; }
            }
            this._hideForm();
            onOk(values);
        };
        // 回车确认
        mask.addEventListener("keydown", (e) => {
            if (e.key === "Enter") mask.querySelector(".elza-form-ok").click();
            if (e.key === "Escape") this._hideForm();
        });

        this._dialogEl.appendChild(mask);
        // 自动聚焦第一个输入框
        setTimeout(() => {
            const inp = mask.querySelector("input");
            if (inp) inp.focus();
        }, 50);
    }

    _hideForm() {
        const el = document.getElementById("elza-wb-form");
        if (el) el.remove();
    }

    _showCatForm(parentCat1) {
        // parentCat1 === null → 新增/编辑一级分类
        // parentCat1 !== null → 新增二级分类（在 parentCat1 下）
        const isCat1 = (parentCat1 === null);
        const title = isCat1 ? "新增一级分类" : `在「${parentCat1}」下新增二级分类`;
        this._showForm(title, [
            { label: "分类名", value: "", maxlength: 8, placeholder: "不超过 8 字符" },
        ], (vals) => {
            const name = vals["分类名"];
            if (isCat1) {
                if (this.data[name]) { alert("分类名已存在"); return; }
                this.data[name] = {};
                this.selCat1 = name;
                this.selCat2 = null;
            } else {
                if (this.data[parentCat1][name] !== undefined) { alert("分类名已存在"); return; }
                this.data[parentCat1][name] = [];
                this.selCat1 = parentCat1;
                this.selCat2 = name;
            }
            this.modified = true;
            this._renderTree();
            this._renderTags();
            this._save(true);
        });
    }

    _showTagForm(editInfo) {
        // editInfo: null → 新增; {zh, en, idx} → 编辑
        const isEdit = !!editInfo;
        const title = isEdit ? "编辑词条" : `新增词条（${this.selCat1} > ${this.selCat2}）`;
        this._showForm(title, [
            { label: "中文", value: editInfo ? editInfo.zh : "", maxlength: 100, placeholder: "中文" },
            { label: "英文", value: editInfo ? editInfo.en : "", maxlength: 100, placeholder: "English" },
        ], (vals) => {
            const zh = vals["中文"], en = vals["英文"];
            const tags = this.data[this.selCat1][this.selCat2];
            if (isEdit) {
                const oldZh = editInfo.zh, oldEn = editInfo.en;
                tags[editInfo.idx] = `${zh}|${en}`;
                // 同步已选
                const si = this.selectedTags.findIndex(t => t.zh === oldZh && t.en === oldEn);
                if (si >= 0) { this.selectedTags[si] = { zh, en }; }
            } else {
                tags.push(`${zh}|${en}`);
            }
            this.modified = true;
            this._renderTags();
            this._renderSelected();
            this._save(true);
        });
    }

    // ── 数据 ──────────────────────────────────────────────
    async _load() {
        try {
            const r = await fetch("/elza/wordbank/load");
            const j = await r.json();
            if (j.success) this.data = j.data || {};
        } catch (e) {
            console.error("[Elza PromptHub] 词库加载失败:", e);
        }
        this._renderTree();
        this._renderSelected();
    }

    async _save(silent) {
        if (!this.modified) return true;
        if (!silent) {
            this._saving = true;
            this._showLoading("保存中...");
        }
        try {
            const r = await fetch("/elza/wordbank/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: this.data }),
            });
            const j = await r.json();
            if (j.success) { this.modified = false; if (!silent) this._hideLoading(); return true; }
            if (!silent) { this._hideLoading(); alert("保存失败: " + (j.error || "未知错误")); }
            else { alert("后台保存失败: " + (j.error || "未知错误")); console.error("[Elza PromptHub] 保存失败:", j.error); }
            return false;
        } catch (e) {
            if (!silent) { this._hideLoading(); alert("保存失败"); }
            else { alert("后台保存失败: 网络或服务器异常"); console.error("[Elza PromptHub] 保存失败:", e); }
            return false;
        }
    }

    // ── 左栏：分类树 ──────────────────────────────────────
    _renderTree() {
        const el = this._treeEl;
        el.innerHTML = "";
        const cats = Object.keys(this.data).sort();
        for (const cat1 of cats) {
            const isExpanded = (cat1 === this.selCat1);
            // 选中二级时，一级不显示高亮
            const isSel1 = isExpanded && !this.selCat2;
            el.appendChild(this._catEl(cat1, 0, isSel1, null));

            if (isExpanded) {
                const subs = Object.keys(this.data[cat1] || {}).sort();
                for (const cat2 of subs) {
                    const isSel2 = (cat2 === this.selCat2);
                    el.appendChild(this._catEl(cat2, 1, isSel2, cat1));
                }
            }
        }
        this._updateBtns();
    }

    _catEl(name, level, selected, parentCat1) {
        const div = document.createElement("div");
        div.className = "elza-cat-item" + (level === 1 ? " elza-sub-item" : "") + (selected ? " selected" : "");
        div.innerHTML = level === 0
            ? `<span class="elza-arrow">${selected ? "▼" : "▸"}</span><span>${name}</span>`
            : `<span style="color:#555;margin-right:2px;">├</span><span>${name}</span>`;

        div.onclick = () => {
            if (level === 0) {
                this.selCat1 = (this.selCat1 === name) ? null : name;
                this.selCat2 = null;
            } else {
                this.selCat1 = parentCat1;
                this.selCat2 = (this.selCat2 === name) ? null : name;
            }
            this._renderTree();
            this._renderTags();
        };

        div.oncontextmenu = (e) => {
            e.preventDefault(); e.stopPropagation();
            if (level === 0) {
                this._showCtxMenu(e.clientX, e.clientY, [
                    { label: "✎ 编辑", action: () => this._editCat1(name) },
                    { label: "🗑 删除", action: () => this._deleteCat1(name) },
                ]);
            } else {
                this._showCtxMenu(e.clientX, e.clientY, [
                    { label: "✎ 编辑", action: () => this._editCat2(parentCat1, name) },
                    { label: "🗑 删除", action: () => this._deleteCat2(parentCat1, name) },
                ]);
            }
        };

        return div;
    }

    _updateBtns() {
        // 无高亮，只区分可用/灰色
        this._btnCat1.disabled = false;

        if (!this.selCat1) {
            this._btnCat2.disabled = true;
            this._btnTag.disabled = true;
        } else if (!this.selCat2) {
            this._btnCat2.disabled = false;
            this._btnTag.disabled = true;
        } else {
            this._btnCat2.disabled = true;
            this._btnTag.disabled = false;
        }
    }

    // ── 中栏：词条列表（上英文下中文）────────────────────
    _renderTags() {
        const el = this._midEl;
        el.innerHTML = "";
        if (!this.selCat1 || !this.selCat2) {
            el.innerHTML = '<div style="color:#666;padding:20px;">请选择二级分类查看词条</div>';
            return;
        }
        const tags = this.data[this.selCat1]?.[this.selCat2] || [];
        for (let i = 0; i < tags.length; i++) {
            el.appendChild(this._tagEl(tags[i], i));
        }
    }

    _tagEl(raw, idx) {
        const m = raw.match(/^([^|]*)\|(.*)$/) || [null, raw, raw];
        const zh = m[1], en = m[2];
        const isSel = this.selectedTags.some(t => t.zh === zh && t.en === en);
        const div = document.createElement("div");
        div.className = "elza-tag-item" + (isSel ? " selected" : "");

        // 字符太多时缩小字号
        if (en.length > 20 || zh.length > 15) {
            div.classList.add("elza-small-text");
        }

        const enSpan = document.createElement("div");
        enSpan.className = "elza-tag-en";
        enSpan.textContent = en;
        enSpan.title = en; // hover时显示完整内容
        div.appendChild(enSpan);

        if (zh !== en) {
            const zhSpan = document.createElement("div");
            zhSpan.className = "elza-tag-zh";
            zhSpan.textContent = zh;
            zhSpan.title = zh;
            div.appendChild(zhSpan);
        }

        div.onclick = () => this._toggleTag(zh, en);
        div.oncontextmenu = (e) => {
            e.preventDefault(); e.stopPropagation();
            this._showCtxMenu(e.clientX, e.clientY, [
                { label: "✎ 编辑", action: () => this._showTagForm({ zh, en, idx }) },
                { label: "🗑 删除", action: () => this._deleteTag(idx) },
            ]);
        };

        return div;
    }

    _toggleTag(zh, en) {
        const idx = this.selectedTags.findIndex(t => t.zh === zh && t.en === en);
        if (idx >= 0) {
            this.selectedTags.splice(idx, 1);
        } else {
            this.selectedTags.push({ zh, en });
        }
        this._renderTags();
        this._renderSelected();
    }

    // ── 右栏：已选（一行两个）──────────────���────────────
    _renderSelected() {
        this._selTitle.textContent = `已选 (${this.selectedTags.length})`;
        const el = this._selList;
        el.innerHTML = "";
        for (let i = 0; i < this.selectedTags.length; i++) {
            const { zh, en } = this.selectedTags[i];
            const div = document.createElement("div");
            div.className = "elza-sel-tag";
            div.innerHTML = `
              <div class="elza-sel-body">
                <div class="elza-sel-en">${en}</div>
                <div class="elza-sel-zh">${zh}</div>
              </div>
              <span class="elza-sel-x" data-idx="${i}">✕</span>`;
            div.querySelector(".elza-sel-x").onclick = (e) => {
                e.stopPropagation();
                this.selectedTags.splice(i, 1);
                this._renderTags();
                this._renderSelected();
            };
            el.appendChild(div);
        }
    }

    // ── CRUD 分类 ────────────────────────────────────────
    _editCat1(oldName) {
        this._showForm("编辑一级分类", [
            { label: "分类名", value: oldName, maxlength: 8, placeholder: "不超过 8 字符" },
        ], (vals) => {
            const n = vals["分类名"];
            if (n === oldName) return;
            if (this.data[n]) { alert("分类名已存在"); return; }
            this.data[n] = this.data[oldName];
            delete this.data[oldName];
            if (this.selCat1 === oldName) this.selCat1 = n;
            this.modified = true;
            this._renderTree();
            this._renderTags();
            this._save(true);
        });
    }

    _editCat2(cat1, oldName) {
        this._showForm("编辑二级分类", [
            { label: "分类名", value: oldName, maxlength: 8, placeholder: "不超过 8 字符" },
        ], (vals) => {
            const n = vals["分类名"];
            if (n === oldName) return;
            if (this.data[cat1][n] !== undefined) { alert("分类名已存在"); return; }
            this.data[cat1][n] = this.data[cat1][oldName];
            delete this.data[cat1][oldName];
            if (this.selCat2 === oldName) this.selCat2 = n;
            this.modified = true;
            this._renderTree();
            this._renderTags();
            this._save(true);
        });
    }

    _deleteCat1(name) {
        if (!confirm(`确定删除一级分类「${name}」及其所有数据？`)) return;
        delete this.data[name];
        if (this.selCat1 === name) { this.selCat1 = null; this.selCat2 = null; }
        this.selectedTags = [];
        this.modified = true;
        this._renderTree(); this._renderTags(); this._renderSelected();
        this._save(true);
    }

    _deleteCat2(cat1, name) {
        if (!confirm(`确定删除二级分类「${name}」及其所有词条？`)) return;
        delete this.data[cat1][name];
        if (this.selCat2 === name) this.selCat2 = null;
        this.selectedTags = [];
        this.modified = true;
        this._renderTree(); this._renderTags(); this._renderSelected();
        this._save(true);
    }

    _deleteTag(idx) {
        if (!confirm("确定删除该词条？")) return;
        const tags = this.data[this.selCat1][this.selCat2];
        const raw = tags[idx];
        const m = raw.match(/^([^|]*)\|(.*)$/) || [null, raw, raw];
        tags.splice(idx, 1);
        const si = this.selectedTags.findIndex(t => t.zh === m[1] && t.en === m[2]);
        if (si >= 0) this.selectedTags.splice(si, 1);
        this.modified = true;
        this._renderTags();
        this._renderSelected();
        this._save(true);
    }

    // ── 右键菜单 ──────────────────────────────────────────
    _showCtxMenu(x, y, items) {
        this._hideCtxMenu();
        const menu = document.createElement("div");
        menu.className = "elza-wb-ctxmenu";
        for (const it of items) {
            const row = document.createElement("div");
            row.className = "elza-ctx-item";
            row.textContent = it.label;
            row.onclick = () => { this._hideCtxMenu(); it.action(); };
            menu.appendChild(row);
        }
        menu.style.left = x + "px";
        menu.style.top = y + "px";
        document.body.appendChild(menu);
        this._ctxMenu = menu;
    }

    _hideCtxMenu() {
        if (this._ctxMenu) { this._ctxMenu.remove(); this._ctxMenu = null; }
    }

    // ── 确认 / 取消 ───────────────────────────────────────
    async confirm() {
        this._hideForm();
        
        // 方案 A：存为 JSON 字符串，保留完整中英文状态
        const tagStr = JSON.stringify(this.selectedTags);

        // 终极方案：存入 node.properties，不作为 Widget
        if (!this.node.properties) this.node.properties = {};
        this.node.properties.elza_selected_tags = tagStr;

        // 写入静态的 text_display widget（用于展示）
        const displayW = this.node.widgets.find(w => w.name === "text_display");
        if (displayW) {
            const displayEnStr = this.selectedTags.map(t => t.en).join(",");
            displayW.value = displayEnStr ? displayEnStr : "(空)";
        }

        app.graph.setDirtyCanvas(true, true);
        this.destroy();
    }

    cancel() {
        this._hideForm();
        this.destroy();
    }

    destroy() {
        if (this._overlay) { this._overlay.remove(); this._overlay = null; }
        this._hideCtxMenu();
        this._hideLoading();
        if (_bankInst === this) _bankInst = null;
    }
}

// ==================================================================
//  Extension
// ==================================================================
app.registerExtension({
    name: "Elza.PromptHub",

    async beforeRegisterNodeDef(nodeType, nodeData) {

        // ── Prompt Switch ────────────────────────────────
        if (nodeData.name === "ElzaPromptHub_PromptSwitch") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const result = onNodeCreated?.apply(this, arguments);

                if (!this._elzaPromptInfo) {
                    this._elzaPromptInfo = [];
                    for (let i = 0; i < MAX_PROMPTS; i++) {
                        const w = this.widgets.find(w => w.name === `prompt_${i}`);
                        if (w) {
                            this._elzaPromptInfo.push({
                                widget: w,
                                origType: w.type,
                                origComputeSize: w.computeSize,
                            });
                            // placeholder 做 index 标签（UI 不动）
                            if (w.inputEl) {
                                w.inputEl.placeholder = `index ${i}`;
                            }
                        }
                    }
                }

                const countW = this.widgets.find(w => w.name === "count");
                if (countW && !countW._elzaHooked) {
                    const origCb = countW.callback;
                    countW.callback = function (value, _app, canvas) {
                        this._elzaUpdateVisibility?.();
                        if (origCb) origCb.call(this, value, _app, canvas);
                    }.bind(this);
                    countW._elzaHooked = true;
                }

                this._elzaUpdateVisibility?.();
                return result;
            };

            // Canvas 绘制 index 标签（纯 UI，不动逻辑）
            const origOnDrawForeground = nodeType.prototype.onDrawForeground;
            nodeType.prototype.onDrawForeground = function (ctx) {
                if (origOnDrawForeground) origOnDrawForeground.apply(this, arguments);
                if (this.flags.collapsed) return;
                const countW = this.widgets.find(w => w.name === "count");
                const count = countW ? Math.max(1, Math.min(MAX_PROMPTS, countW.value)) : 3;
                ctx.save();
                ctx.fillStyle = "#888";
                ctx.font = "9px monospace";
                for (let i = 0; i < count; i++) {
                    const w = this.widgets.find(w => w === this._elzaPromptInfo[i]?.widget);
                    if (w && w.last_y !== undefined) {
                        ctx.fillText(`[index ${i}]`, 10, w.last_y + 6);
                    }
                }
                ctx.restore();
            };

            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function (widgetConfig) {
                const result = onConfigure?.apply(this, arguments);
                requestAnimationFrame(() => { this._elzaUpdateVisibility?.(); });
                return result;
            };

            nodeType.prototype._elzaUpdateVisibility = function () {
                if (!this._elzaPromptInfo) return;
                const countW = this.widgets.find(w => w.name === "count");
                const indexW = this.widgets.find(w => w.name === "index");
                if (!countW || !indexW) return;
                const count = Math.max(1, Math.min(MAX_PROMPTS, countW.value));
                if (indexW.value >= count) {
                    indexW.value = Math.max(0, count - 1);
                }
                indexW.options.max = count - 1;
                for (let i = 0; i < this._elzaPromptInfo.length; i++) {
                    const { widget, origType, origComputeSize } = this._elzaPromptInfo[i];
                    if (i < count) {
                        widget.type = origType;
                        widget.computeSize = origComputeSize;
                    } else {
                        widget.type = "hidden";
                        widget.computeSize = () => [0, -4];
                    }
                }
                this.setSize(this.computeSize());
                app.graph.setDirtyCanvas(true, true);
            };
        }

        // ── Prompt Bank ──────────────────────────────────
        if (nodeData.name === "ElzaPromptHub_PromptBank") {

            // ---- onNodeCreated ----
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const result = onNodeCreated?.apply(this, arguments);

                // 按钮
                this.addWidget("button", "📋 打开词库", null, () => {
                    new ElzaWordBankDialog(this);
                });
                // 按钮移到最前
                const btnW = this.widgets.pop();
                this.widgets.unshift(btnW);

                // text_display 只读样式（UI 不动）
                const displayW = this.widgets.find(w => w.name === "text_display");
                if (displayW) {
                    const applyStyle = () => {
                        if (displayW.inputEl) {
                            displayW.inputEl.readOnly = true;
                            displayW.inputEl.style.pointerEvents = "none";
                            displayW.inputEl.style.opacity = 0.7;
                            displayW.inputEl.style.overflow = "hidden";
                            displayW.inputEl.style.backgroundColor = "rgba(0,0,0,0.2)";
                            displayW.inputEl.style.border = "1px dashed #555";
                        }
                    };
                    if (displayW.inputEl) applyStyle();
                    else requestAnimationFrame(applyStyle);
                }

                return result;
            };

            // ---- onConfigure (工作流加载恢复) ----
            const origOnConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function (widgetConfig) {
                origOnConfigure?.apply(this, arguments);
                // 按名字恢复 widget 值，不受排序影响
                if (this.widgets_values?.length >= 2) {
                    const len = this.widgets_values.length;
                    const displayW = this.widgets.find(w => w.name === "text_display");
                    if (displayW) displayW.value = this.widgets_values[len - 2] || "(空)";
                    const extraW = this.widgets.find(w => w.name === "extra_prompt");
                    if (extraW) extraW.value = this.widgets_values[len - 1] || "";
                }
            };
        }
    },
});
