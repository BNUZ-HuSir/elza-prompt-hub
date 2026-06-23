import re
import random


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
        # 动态生成 99 个多行文本输入框
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
                   "• 不含语法时原样输出，选中框有 ▶ 标识")

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
        selected = kwargs.get(f"prompt_{index}", "")
        if not selected:
            return ("",)
        result = self._parse_dynamic(selected)
        return (result,)

    # ------------------------------------------------------------------
    # 随机语法解析
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_dynamic(text):
        """解析 {a|b} 和 {N$$ a|b|c} 随机语法。"""
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
