import { app } from "../../scripts/app.js";

const MAX_PROMPTS = 99;

app.registerExtension({
    name: "Elza.PromptHub",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "ElzaPromptHub_PromptSwitch") return;

        // ---- 初始化：保存每个 prompt widget 的原始状态 ----
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
                    }
                }
            }

            // count 变化时刷新可见性
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

        // ---- 工作流加载后恢复 ----
        const onConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (widgetConfig) {
            const result = onConfigure?.apply(this, arguments);
            requestAnimationFrame(() => {
                this._elzaUpdateVisibility?.();
            });
            return result;
        };

        // ---- 核心：根据 count 显示/隐藏 prompt 控件 ----
        nodeType.prototype._elzaUpdateVisibility = function () {
            if (!this._elzaPromptInfo) return;

            const countW = this.widgets.find(w => w.name === "count");
            const indexW = this.widgets.find(w => w.name === "index");
            if (!countW || !indexW) return;

            const count = Math.max(1, Math.min(MAX_PROMPTS, countW.value));

            // clamp index
            if (indexW.value >= count) {
                indexW.value = Math.max(0, count - 1);
            }
            indexW.options.max = count - 1;

            // 批量显隐
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
    },
});
