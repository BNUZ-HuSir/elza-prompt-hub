import json
import random

try:
    from .prompt_syntax import DynamicPromptSyntaxError, parse_dynamic
except ImportError:  # 允许直接运行本目录内的测试
    from prompt_syntax import DynamicPromptSyntaxError, parse_dynamic

class _FlexiblePromptInputs(dict):
    """允许前端创建任意 ``prompt_N`` STRING 输入端口。

    该对象序列化到前端时为空字典，因此不会生成 99 个 widget；服务端验证动态
    输入时仍能获取正确的 STRING 类型。
    """

    def __contains__(self, key):
        return (
            isinstance(key, str)
            and key.startswith("prompt_")
            and key[7:].isdigit()
        )

    def __getitem__(self, key):
        if key in self:
            return ("STRING", {"forceInput": True})
        raise KeyError(key)

    def get(self, key, default=None):
        try:
            return self[key]
        except KeyError:
            return default


class _FlexibleJoinInputs(dict):
    """允许前端按需创建 ``text_N`` STRING 输入，最多 20 个。"""

    MAX_INPUTS = 20

    def __contains__(self, key):
        if not isinstance(key, str) or not key.startswith("text_"):
            return False
        suffix = key[5:]
        return suffix.isdigit() and 0 <= int(suffix) < self.MAX_INPUTS

    def __getitem__(self, key):
        if key in self:
            return ("STRING", {"forceInput": True})
        raise KeyError(key)

    def get(self, key, default=None):
        try:
            return self[key]
        except KeyError:
            return default


class ElzaPromptHub_PromptSwitch:
    """多栏预设词切换节点。

    通过 index 选择当前生效的 Prompt。每个槽位均为原生 STRING 输入端口；
    未连接时读取 node.properties 中保存的本地多行文本。
    支持随机词语法：
      {a|b|c}              → 随机选 1 个
      {0.5::a|1.5::b}      → 按相对权重随机
      {2$$a|b|c}           → 无重复随机选 2 个
      {a|}                 → 空字符串也是合法选项
    不含语法时原样输出。
    """

    MAX_PROMPTS = 99
    DEFAULT_PROMPTS = 3
    STATE_PROPERTY = "elza_prompt_switch"
    LEGACY_PROPERTY = "elza_prompts"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "index": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": cls.MAX_PROMPTS - 1,
                    "step": 1,
                    "display": "number",
                }),
                "count": ("INT", {
                    "default": cls.DEFAULT_PROMPTS,
                    "min": 1,
                    "max": cls.MAX_PROMPTS,
                    "step": 1,
                    "display": "number",
                }),
            },
            "optional": _FlexiblePromptInputs(),
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "process"
    CATEGORY = "Elza/prompt"
    DESCRIPTION = ("多栏预设词切换器。\n"
                   "• index: 当前生效的预设编号\n"
                   "• count: 目标 Prompt 数量，点击更新后生效\n"
                   "• 节点内多行文本框: 编辑本地 Prompt\n"
                   "• 每个 prompt_N 都可连接原生 STRING\n"
                   "• 语法: {a|b}, {0.5::a|1.5::b}, {2$$a|b|c}, {a|}\n"
                   "• 不含语法时原样输出")

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        # 随机节点每次都需要重新执行，不能被缓存
        return float("NaN")

    @classmethod
    def VALIDATE_INPUTS(cls, index, count, **kwargs):
        """执行前校验 index 和 count 的绝对范围。"""
        if index < 0:
            return f"index ({index}) 不能为负数"
        if index >= cls.MAX_PROMPTS:
            return f"index ({index}) 超出最大范围 0~{cls.MAX_PROMPTS - 1}"
        if count < 1 or count > cls.MAX_PROMPTS:
            return f"count ({count}) 超出有效范围 1~{cls.MAX_PROMPTS}"
        return True

    def process(self, index, count=DEFAULT_PROMPTS, unique_id=None,
                extra_pnginfo=None, **kwargs):
        """优先读取连接的 STRING，否则读取本地 Prompt，最后展开随机语法。"""

        input_name = f"prompt_{index}"
        prompts = self._load_local_prompts(unique_id, extra_pnginfo)
        try:
            requested_count = max(1, min(self.MAX_PROMPTS, int(count)))
        except (TypeError, ValueError):
            requested_count = self.DEFAULT_PROMPTS
        connected_indices = [
            int(name[7:])
            for name in kwargs
            if name.startswith("prompt_") and name[7:].isdigit()
        ]
        slot_count = max(
            len(prompts),
            requested_count,
            max(connected_indices, default=-1) + 1,
        )

        if index >= slot_count:
            raise ValueError(
                f"index ({index}) 超出有效范围（当前共有 {slot_count} 个 Prompt 槽位）"
            )

        if input_name in kwargs:
            selected = kwargs.get(input_name)
        elif index < len(prompts):
            selected = prompts[index]
        else:
            selected = ""

        if selected is None:
            selected = ""
        try:
            return (parse_dynamic(str(selected)),)
        except DynamicPromptSyntaxError as error:
            raise ValueError(f"Prompt {index} 随机语法错误：{error}") from error

    # ------------------------------------------------------------------
    # 随机语法解析
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_dynamic(text):
        return parse_dynamic(text)

    @classmethod
    def _load_local_prompts(cls, unique_id, extra_pnginfo):
        """从新状态或旧 ``elza_prompts`` 属性中读取本地 Prompt。"""

        try:
            if isinstance(unique_id, (list, tuple)) and unique_id:
                unique_id = unique_id[0]
            if unique_id is None:
                return []

            workflow = None
            if isinstance(extra_pnginfo, dict):
                workflow = extra_pnginfo.get("workflow")
            elif isinstance(extra_pnginfo, (list, tuple)) and extra_pnginfo:
                first = extra_pnginfo[0]
                if isinstance(first, dict):
                    workflow = first.get("workflow")
            if not isinstance(workflow, dict):
                return []

            node_data = next(
                (
                    node for node in workflow.get("nodes", [])
                    if str(node.get("id")) == str(unique_id)
                ),
                None,
            )
            if not node_data:
                return []

            properties = node_data.get("properties", {})
            state_value = properties.get(cls.STATE_PROPERTY)
            if isinstance(state_value, str):
                state_value = json.loads(state_value)
            if isinstance(state_value, dict):
                prompts = state_value.get("prompts", [])
                if isinstance(prompts, list):
                    normalized = ["" if value is None else str(value) for value in prompts]
                    try:
                        count = int(state_value.get("count", len(normalized)))
                    except (TypeError, ValueError):
                        count = len(normalized)
                    count = max(1, min(cls.MAX_PROMPTS, count))
                    normalized = normalized[:count]
                    normalized.extend([""] * (count - len(normalized)))
                    return normalized

            legacy_value = properties.get(cls.LEGACY_PROPERTY, [])
            if isinstance(legacy_value, str):
                legacy_value = json.loads(legacy_value)
            if isinstance(legacy_value, list):
                return ["" if value is None else str(value) for value in legacy_value]
        except (json.JSONDecodeError, TypeError, ValueError) as error:
            print(f"[Elza PromptHub] Prompt Switch 状态读取失败：{error}")
        return []


class ElzaPromptHub_CustomPromptJoin:
    """把多个带自定义标签的 Prompt 展开随机语法后依次拼接。"""

    MIN_INPUTS = 1
    MAX_INPUTS = 20
    DEFAULT_INPUTS = 3
    DEFAULT_SEPARATOR = ", "
    DEFAULT_RANDOM_MODE = "随机"
    DEFAULT_SEED = 0
    STATE_PROPERTY = "elza_custom_prompt_join"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "count": (
                    "INT",
                    {
                        "default": cls.DEFAULT_INPUTS,
                        "min": cls.MIN_INPUTS,
                        "max": cls.MAX_INPUTS,
                        "step": 1,
                        "display": "number",
                    },
                ),
            },
            "optional": _FlexibleJoinInputs(),
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "process"
    CATEGORY = "Elza/prompt"
    DESCRIPTION = (
        "动态创建 1～20 个带自定义标签的多行 Prompt。每个文本框都可连接 STRING；"
        "空项自动跳过，各项先展开随机语法，再使用 separator 拼接。固定 seed 可复现；"
        "随机模式的运行 seed 在每次 Queue 前生成并显示。"
    )

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        # 本地文本保存在 workflow properties 中，始终执行可避免属性变化被缓存遗漏。
        return float("NaN")

    @classmethod
    def VALIDATE_INPUTS(cls, count, **kwargs):
        try:
            numeric_count = int(count)
        except (TypeError, ValueError):
            return "count 必须是整数"
        if numeric_count < cls.MIN_INPUTS or numeric_count > cls.MAX_INPUTS:
            return f"count ({numeric_count}) 超出有效范围 {cls.MIN_INPUTS}~{cls.MAX_INPUTS}"
        return True

    @classmethod
    def _clamp_count(cls, value):
        try:
            numeric = int(value)
        except (TypeError, ValueError):
            numeric = cls.DEFAULT_INPUTS
        return max(cls.MIN_INPUTS, min(cls.MAX_INPUTS, numeric))

    @classmethod
    def _normalize_state(cls, value):
        if not isinstance(value, dict):
            return None
        count = cls._clamp_count(value.get("count", cls.DEFAULT_INPUTS))
        raw_items = value.get("items", [])
        items = []
        for index in range(count):
            item = raw_items[index] if isinstance(raw_items, list) and index < len(raw_items) else {}
            if not isinstance(item, dict):
                item = {}
            items.append({
                "label": str(item.get("label") or f"输入 {index + 1}"),
                "text": "" if item.get("text") is None else str(item.get("text", "")),
            })
        try:
            seed = max(0, int(value.get("seed", cls.DEFAULT_SEED)))
        except (TypeError, ValueError):
            seed = cls.DEFAULT_SEED
        runtime_seed = value.get("runtime_seed")
        try:
            runtime_seed = max(0, int(runtime_seed)) if runtime_seed is not None else None
        except (TypeError, ValueError):
            runtime_seed = None
        random_mode = str(value.get("random_mode", cls.DEFAULT_RANDOM_MODE))
        if random_mode not in {"随机", "固定"}:
            random_mode = cls.DEFAULT_RANDOM_MODE
        raw_separator = value.get("separator", cls.DEFAULT_SEPARATOR)
        return {
            "count": count,
            "separator": cls.DEFAULT_SEPARATOR if raw_separator is None else str(raw_separator),
            "random_mode": random_mode,
            "seed": seed,
            # 随机模式由前端在 Queue 前写入本次实际使用的运行 seed。
            # 旧 workflow 没有该字段时保留 SystemRandom 回退，避免破坏兼容性。
            "runtime_seed": runtime_seed,
            "items": items,
        }

    @classmethod
    def _load_state(cls, unique_id, extra_pnginfo):
        try:
            if isinstance(unique_id, (list, tuple)) and unique_id:
                unique_id = unique_id[0]
            if unique_id is None:
                return None

            workflow = None
            if isinstance(extra_pnginfo, dict):
                workflow = extra_pnginfo.get("workflow")
            elif isinstance(extra_pnginfo, (list, tuple)) and extra_pnginfo:
                first = extra_pnginfo[0]
                if isinstance(first, dict):
                    workflow = first.get("workflow")
            if not isinstance(workflow, dict):
                return None

            node_data = next(
                (
                    node for node in workflow.get("nodes", [])
                    if str(node.get("id")) == str(unique_id)
                ),
                None,
            )
            if not node_data:
                return None
            state = node_data.get("properties", {}).get(cls.STATE_PROPERTY)
            if isinstance(state, str):
                state = json.loads(state)
            return cls._normalize_state(state)
        except (json.JSONDecodeError, TypeError, ValueError) as error:
            print(f"[Elza PromptHub] Custom Prompt Join 状态读取失败：{error}")
            return None

    def process(self, count=DEFAULT_INPUTS, unique_id=None, extra_pnginfo=None, **kwargs):
        state = self._load_state(unique_id, extra_pnginfo)
        effective_count = state["count"] if state else self._clamp_count(count)
        separator = state["separator"] if state else self.DEFAULT_SEPARATOR
        random_mode = state["random_mode"] if state else self.DEFAULT_RANDOM_MODE
        seed = state["seed"] if state else self.DEFAULT_SEED
        runtime_seed = state.get("runtime_seed") if state else None
        items = state["items"] if state else [
            {"label": f"输入 {index + 1}", "text": ""}
            for index in range(effective_count)
        ]

        if random_mode == "随机":
            # 新版前端在每次 Queue 前把本次 seed 写入 workflow properties，
            # 因此一个 Queue 内所有随机语法共享同一条可追溯的随机序列。
            # 旧 workflow / API 调用若没有 runtime_seed，则使用兼容回退。
            rng = random.Random(runtime_seed) if runtime_seed is not None else random.SystemRandom()
        else:
            rng = random.Random(seed)
        fragments = []
        for index in range(effective_count):
            input_name = f"text_{index}"
            local_item = items[index] if index < len(items) else {}
            source = kwargs[input_name] if input_name in kwargs else local_item.get("text", "")
            source = "" if source is None else str(source).strip()
            if not source:
                continue
            try:
                rendered = parse_dynamic(source, rng).strip()
            except DynamicPromptSyntaxError as error:
                label = str(local_item.get("label") or f"输入 {index + 1}")
                raise ValueError(
                    f"Custom Prompt Join 的“{label}”随机语法错误：{error}"
                ) from error
            if rendered:
                fragments.append(rendered)
        return (separator.join(fragments),)
