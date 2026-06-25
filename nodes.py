import re
import random
import os
import yaml
import json

# ── 词库数据路径 ──────────────────────────────────────────
_PLUGIN_DIR = os.path.dirname(os.path.abspath(__file__))
WORDBANK_PATH = os.path.join(_PLUGIN_DIR, "wordbank.yaml")


def load_wordbank():
    """读取词库 YAML，返回 dict。文件不存在时返回空 dict。"""
    if not os.path.exists(WORDBANK_PATH):
        return {}
    with open(WORDBANK_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
        return data if data is not None else {}


def save_wordbank(data):
    """将 dict 写入词库 YAML。"""
    with open(WORDBANK_PATH, "w", encoding="utf-8") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False)

# ── API Routes ────────────────────────────────────────────
try:
    from aiohttp import web
    from server import PromptServer

    @PromptServer.instance.routes.get("/elza/wordbank/load")
    async def _elza_wordbank_load(request):
        try:
            data = load_wordbank()
            return web.json_response({"success": True, "data": data})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})

    @PromptServer.instance.routes.post("/elza/wordbank/save")
    async def _elza_wordbank_save(request):
        try:
            body = await request.json()
            save_wordbank(body.get("data", {}))
            return web.json_response({"success": True})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})

    @PromptServer.instance.routes.post("/elza/wordbank/export")
    async def _elza_wordbank_export(request):
        """接收前端传来的词库数据，用 yaml.dump 序列化后返回，
           保证和 load_wordbank() 使用同一套 YAML 规则。"""
        try:
            body = await request.json()
            data = body.get("data", {})
            yaml_str = yaml.dump(
                data, allow_unicode=True, sort_keys=False,
                default_flow_style=False,
            )
            return web.Response(
                body=yaml_str.encode("utf-8"),
                content_type="application/x-yaml",
            )
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})

except ImportError:
    pass  # ComfyUI 环境未就绪时不注册路由


# ── 随机语法解析（公共函数）────────────────────────────────
def parse_dynamic(text):
    """解析 {a|b} 和 {N$$ a|b|c} 随机语法，供所有节点复用。"""
    def _replace(match: re.Match) -> str:
        content = match.group(1)

        # 检测 "N$$" 前缀：{2$$ a|b|c}
        n_match = re.match(r'(\d+)\$\$\s*(.+)', content)
        if n_match:
            n = int(n_match.group(1))
            opts_str = n_match.group(2)
        else:
            n = 1
            opts_str = content

        # 按 | 拆分并清洗
        opts = [o.strip() for o in opts_str.split('|') if o.strip()]
        if not opts:
            return ''

        # 超过选项数时输出警告
        if n > len(opts):
            print(f"[Elza PromptHub] ⚠ {n}$$ 超出选项数量 ({len(opts)})，已自动限制为 {len(opts)}：{{{content}}}")
            n = len(opts)
        # 随机选取 N 个索引，排序后按原顺序取值
        indices = random.sample(range(len(opts)), n)
        indices.sort()
        chosen = [opts[i] for i in indices]
        return ','.join(chosen)

    return re.sub(r'\{([^}]+)\}', _replace, text)


class ElzaPromptHub_PromptSwitch:
    """多栏预设词切换节点。

    通过 index 选择当前生效的预设词，count 控制下方显示的多行输入框数量。
    支持随机词语法：
      {a|b}        → 从选项中随机选 1 个
      {N$$ a|b|c}  → 从选项中随机选 N 个，逗号拼接
    不含语法时原样输出。
    """

    MAX_PROMPTS = 99

    @classmethod
    def INPUT_TYPES(cls):
        inputs = {
            "required": {
                "index": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": cls.MAX_PROMPTS - 1,
                    "step": 1,
                    "display": "number",
                }),
                "count": ("INT", {
                    "default": 3,
                    "min": 1,
                    "max": cls.MAX_PROMPTS,
                    "step": 1,
                    "display": "number",
                }),
            },
            "optional": {},
        }
        # 动态生成 99 个多行文本输入框，必须放在 optional 中，否则旧工作流验证会直接崩溃
        for i in range(cls.MAX_PROMPTS):
            inputs["optional"][f"prompt_{i}"] = ("STRING", {
                "default": "",
                "multiline": True,
            })
        return inputs

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "process"
    CATEGORY = "Elza/prompt"
    DESCRIPTION = ("多栏预设词切换器。\n"
                   "• index: 当前生效的预设编号\n"
                   "• count: 输入框数量\n"
                   "• 语法: {a|b} 随机选1个, {N$$ a|b|c} 随机选N个\n"
                   "• 不含语法时原样输出")

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        # 随机节点每次都需要重新执行，不能被缓存
        return float("NaN")

    @classmethod
    def VALIDATE_INPUTS(cls, index, count, **kwargs):
        """执行前校验：index 必须小于 count。"""
        if index < 0:
            return f"index ({index}) 不能为负数"
        if count < 1:
            return f"count ({count}) 不能小于 1"
        if index >= count:
            return f"index ({index}) 超出有效范围（当前 count={count}，有效 index 为 0~{count - 1}）"
        return True

    def process(self, index, count, **kwargs):
        """获取 index 对应的预设文本，解析随机语法后输出。"""
        # 注意：因为 prompt_x 都是 optional，所以如果用户没填内容，它可能不会出现在 kwargs 里
        # 我们还可以从 kwargs 中尝试寻找所有可能传进来的键
        selected = kwargs.get(f"prompt_{index}")
        
        # 如果 kwargs 里没有，尝试看是否被当做无名参数传进来了（虽然不常见）
        if selected is None:
            # 兼容：有时前端传过来的 kwargs 里可能因为清空了 name 而变成别的名字
            # 但通常我们依靠 JS 端保持 widgets_values 的顺序即可
            selected = ""

        if not selected:
            return ("",)
        result = self._parse_dynamic(selected)
        return (result,)

    # ------------------------------------------------------------------
    # 随机语法解析
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_dynamic(text):
        return parse_dynamic(text)


# ==================================================================
#  Prompt Bank — 词库管理节点
# ==================================================================

class ElzaPromptHub_PromptBank:
    """词库管理节点。

    通过弹窗浏览/管理词库，选择词条后与额外文本拼接输出。
    词库数据以 YAML 格式存储在插件目录下的 wordbank.yaml。
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # Row 2：全静态声明的只读展示框
                "text_display": ("STRING", {"default": "(空)", "multiline": True}),
                # Row 3：额外提示词
                "extra_prompt": ("STRING", {"default": "", "multiline": True}),
            },
            "hidden": {
                # 不再依赖 optional 传递 JSON，彻底杜绝 Widget 渲染！
                # 前端通过 extra_pnginfo (工作流全量数据) 将 JSON 传给后端。
                "unique_id": "UNIQUE_ID",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "process"
    CATEGORY = "Elza/prompt"
    OUTPUT_NODE = True
    DESCRIPTION = ("词库管理节点。\n"
                   "• 点击按钮打开词库弹窗，浏览/选择词条\n"
                   "• 已选词条用逗号拼接后与额外提示词组合输出\n"
                   "• 词库数据存储在 wordbank.yaml")

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("NaN")

    def process(self, text_display, extra_prompt, unique_id=None, extra_pnginfo=None):
        """拼接已选 tags 与额外文本。"""
        
        # 终极方案：从工作流的 properties 中提取 selected_tags 的 JSON 数据
        # 注意：properties 存储在 extra_pnginfo 的 workflow 中。
        # 但有些版本的 ComfyUI 或者第三方执行端（如 API 执行）可能没有传完整 workflow。
        # 作为兜底，我们利用前端始终能正确显示 text_display 的特性：
        # 如果从 properties 拿不到 JSON，我们就直接用 text_display 里的英文进行拼接！
        
        selected_tags_json = "[]"
        if extra_pnginfo and unique_id:
            if isinstance(extra_pnginfo, (list, tuple)) and extra_pnginfo:
                first = extra_pnginfo[0]
                if isinstance(first, dict) and "workflow" in first:
                    wf = first["workflow"]
                    node = next(
                        (x for x in wf["nodes"] if str(x["id"]) == unique_id[0]),
                        None,
                    )
                    if node and "properties" in node:
                        selected_tags_json = node["properties"].get("elza_selected_tags", "[]")

        parsed_tags = []
        try:
            tags_data = json.loads(selected_tags_json)
            if isinstance(tags_data, list) and len(tags_data) > 0:
                parsed_tags = [item.get("en", "") for item in tags_data if isinstance(item, dict) and item.get("en")]
        except json.JSONDecodeError:
            pass

        # 兜底机制：如果在后台 workflow.properties 里找不到（可能是因为 API 执行或者格式差异）
        # 但是前端的 text_display 有值且不是 "(空)"，说明前端是有数据的，我们直接用前端传来的值！
        if not parsed_tags and text_display and text_display != "(空)":
            parsed_tags = [text_display]

        parts = []
        if parsed_tags:
            parts.append(",".join(parsed_tags))
        if extra_prompt:
            # PB-09: extra_prompt 也支持随机语法 {a|b} / {N$$ a|b|c}
            parts.append(parse_dynamic(extra_prompt))
        result = ",".join(parts) if parts else ""
        
        return {"result": (result,)}
