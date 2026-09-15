"""Prompt Bank、Prompt Mixer 与 Random Prompt 节点实现。"""

from __future__ import annotations

from typing import Any

try:
    from .prompt_core import (
        join_prompt_parts,
        read_json_property,
        read_node_properties,
    )
    from .prompt_syntax import DynamicPromptSyntaxError, parse_dynamic
except ImportError:  # 允许从插件目录直接运行测试
    from prompt_core import join_prompt_parts, read_json_property, read_node_properties
    from prompt_syntax import DynamicPromptSyntaxError, parse_dynamic


def _coerce_weight(weight: Any) -> float:
    try:
        return float(weight)
    except (TypeError, ValueError):
        return 1.0


def _format_final_weight(text: str, weight: Any) -> str:
    """给完整 Prompt 应用节点级最终权重。"""

    if not text:
        return ""
    numeric_weight = _coerce_weight(weight)
    if abs(numeric_weight - 1.0) < 1e-9:
        return text
    return f"(({text}):{numeric_weight:g})"


def _format_entry_weight(text: str, weight: Any) -> str:
    """给 Bank 中的单条词条应用权重；1 保持原文。"""

    numeric_weight = _coerce_weight(weight)
    if abs(numeric_weight - 1.0) < 1e-9:
        return text
    return f"({text}:{numeric_weight:g})"


_RESOLUTION_RATIOS = {
    "1:1": (1, 1),
    "3:2": (3, 2),
    "2:3": (2, 3),
    "4:3": (4, 3),
    "3:4": (3, 4),
    "16:9": (16, 9),
    "9:16": (9, 16),
    "21:9": (21, 9),
    "9:21": (9, 21),
}


def _round_resolution(value: float) -> int:
    """将尺寸对齐到 8，满足常见扩散模型下采样要求。"""

    return max(64, int(round(value / 8.0) * 8))


def calculate_resolution(
    mode: str = "常用尺寸",
    preset: str = "1024级",
    aspect_ratio: str = "1:1",
    width: int = 1024,
    height: int = 1024,
    scale_factor: float = 1.0,
)-> tuple[int, int]:
    """根据常用尺寸模式或自定义模式计算最终宽高。"""

    if mode == "自定义":
        result_width = _round_resolution(width)
        result_height = _round_resolution(height)
    else:
        try:
            base = int(str(preset).replace("级", "").strip())
        except (TypeError, ValueError):
            base = 1024
        try:
            factor = float(scale_factor)
        except (TypeError, ValueError):
            factor = 1.0
        factor = max(0.1, min(4.0, factor))
        scaled_base = base * factor
        ratio = _RESOLUTION_RATIOS.get(aspect_ratio, (1, 1))
        result_width = _round_resolution(scaled_base * ratio[0] / max(ratio))
        result_height = _round_resolution(scaled_base * ratio[1] / max(ratio))
    return result_width, result_height


def render_mix_prompt(sections: Any, final_weight: Any = 1.0) -> str:
    """按一级、二级 Tag 顺序拼接 workflow 中保存的词条快照。"""

    fragments: list[str] = []
    if isinstance(sections, list):
        for section in sections:
            if not isinstance(section, dict):
                continue
            for group in section.get("groups", []):
                if not isinstance(group, dict):
                    continue
                selected = group.get("selected")
                if not isinstance(selected, dict):
                    continue
                text = str(selected.get("text_snapshot") or selected.get("text") or "").strip()
                if text:
                    fragments.append(text)
    return _format_final_weight(join_prompt_parts(fragments), final_weight)


class ElzaPromptHub_PromptBank:
    """从外部用户词库选择多个词条，按顺序应用节点级最终权重。"""

    STATE_PROPERTY = "elza_prompt_bank_state"
    LEGACY_PROPERTY = "elza_selected_tags"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text_display": (
                    "STRING",
                    {"default": "(空)", "multiline": True, "dynamicPrompts": False},
                ),
                "extra_prompt": (
                    "STRING",
                    {"default": "", "multiline": True, "dynamicPrompts": False},
                ),
                "final_weight": (
                    "FLOAT",
                    {
                        "default": 1.0,
                        "min": 0.0,
                        "max": 10.0,
                        "step": 0.05,
                        "round": 0.01,
                        "display": "number",
                    },
                ),
            },
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
        "打开 Prompt Bank 选择词条；节点把中英文文本快照保存到 workflow。\n"
        "主数据位于 ComfyUI 用户目录，可用备份按钮另存到用户选择的位置。"
    )

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("NaN")

    def process(
        self,
        text_display: str,
        extra_prompt: str,
        final_weight: float = 1.0,
        unique_id=None,
        extra_pnginfo=None,
    ):
        properties = read_node_properties(unique_id, extra_pnginfo)
        state = read_json_property(properties, self.STATE_PROPERTY)
        selected = state.get("selected", [])
        fragments: list[str] = []

        if isinstance(selected, list):
            for item in selected:
                if not isinstance(item, dict):
                    continue
                text = str(item.get("text_snapshot") or item.get("text") or "").strip()
                if not text:
                    continue
                try:
                    expanded = parse_dynamic(text)
                except DynamicPromptSyntaxError as error:
                    raise ValueError(f"Prompt Bank 词条随机语法错误：{error}") from error
                if expanded:
                    fragments.append(_format_entry_weight(expanded, item.get("weight", 1.0)))

        if not fragments:
            legacy = properties.get(self.LEGACY_PROPERTY, [])
            if isinstance(legacy, str):
                import json

                try:
                    legacy = json.loads(legacy)
                except json.JSONDecodeError:
                    legacy = []
            if isinstance(legacy, list):
                for item in legacy:
                    if isinstance(item, dict):
                        text = str(item.get("en", "")).strip()
                        if text:
                            fragments.append(_format_entry_weight(text, item.get("weight", 1.0)))

        if not fragments and text_display and text_display != "(空)":
            fragments.append(str(text_display).strip())

        if extra_prompt:
            try:
                fragments.append(parse_dynamic(extra_prompt))
            except DynamicPromptSyntaxError as error:
                raise ValueError(f"Prompt Bank extra_prompt 随机语法错误：{error}") from error
        return (_format_final_weight(join_prompt_parts(fragments), final_weight),)


class ElzaPromptHub_PromptMix:
    """从一级/二级 Tag 中各选一个词组并按顺序输出 Prompt。"""

    STATE_PROPERTY = "elza_prompt_mix_state"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "final_weight": (
                    "FLOAT",
                    {
                        "default": 1.0,
                        "min": 0.0,
                        "max": 10.0,
                        "step": 0.05,
                        "round": 0.01,
                        "display": "number",
                    },
                ),
            },
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
        "蓝图节点按一级 Tag 折叠显示全部二级 Tag。\n"
        "每个二级 Tag 单选一个中文词组或不使用，实际输出 workflow 保存的英文快照。"
    )

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("NaN")

    def process(
        self,
        final_weight: float = 1.0,
        unique_id=None,
        extra_pnginfo=None,
    ):
        properties = read_node_properties(unique_id, extra_pnginfo)
        state = read_json_property(properties, self.STATE_PROPERTY)
        sections = state.get("sections", [])
        return (render_mix_prompt(sections, final_weight),)


class ElzaPromptHub_RandomPrompt:
    """单个多行 Prompt，实时显示随机选项概率并在执行时展开。"""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "prompt": (
                    "STRING",
                    {"default": "", "multiline": True, "dynamicPrompts": False},
                ),
                "probability_display": (
                    "STRING",
                    {
                        "default": "输入随机语法后，这里会显示每个选项的出现概率。",
                        "multiline": True,
                        "dynamicPrompts": False,
                    },
                ),
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "process"
    CATEGORY = "Elza/prompt"
    DESCRIPTION = (
        "单个多行随机 Prompt。概率区域实时显示每个随机块的选项出现概率。"
    )

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("NaN")

    @classmethod
    def VALIDATE_INPUTS(cls, prompt: str, probability_display: str):
        try:
            from .prompt_syntax import validate_dynamic_syntax
        except ImportError:
            from prompt_syntax import validate_dynamic_syntax
        try:
            validate_dynamic_syntax(prompt)
        except DynamicPromptSyntaxError as error:
            return f"随机语法错误：{error}"
        return True

    def process(self, prompt: str, probability_display: str):
        try:
            return (parse_dynamic(prompt),)
        except DynamicPromptSyntaxError as error:
            raise ValueError(f"Random Prompt 随机语法错误：{error}") from error


class ElzaPromptHub_Resolution:
    """友好的图像分辨率选择节点，只输出对齐到 8 的宽和高。"""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "mode": (
                    ["常用尺寸", "自定义"],
                    {"default": "常用尺寸"},
                ),
                "size_preset": (
                    ["512级", "768级", "1024级", "1280级", "1536级", "2048级"],
                    {"default": "1024级"},
                ),
                "aspect_ratio": (
                    list(_RESOLUTION_RATIOS),
                    {"default": "1:1"},
                ),
                "width": (
                    "INT",
                    {
                        "default": 1024,
                        "min": 64,
                        "max": 8192,
                        "step": 8,
                        "display": "number",
                    },
                ),
                "height": (
                    "INT",
                    {
                        "default": 1024,
                        "min": 64,
                        "max": 8192,
                        "step": 8,
                        "display": "number",
                    },
                ),
                "scale_factor": (
                    "FLOAT",
                    {
                        "default": 1.0,
                        "min": 0.1,
                        "max": 4.0,
                        "step": 0.05,
                        "round": 0.01,
                        "display": "number",
                    },
                ),
            }
        }

    RETURN_TYPES = ("INT", "INT")
    RETURN_NAMES = ("width", "height")
    FUNCTION = "process"
    CATEGORY = "Elza/image"
    DESCRIPTION = (
        "选择常用尺寸或自定义模式，输出对齐到 8 的 width、height。"
        "常用尺寸下可用 scale_factor 缩放预设基准。"
        "交换宽高是节点按钮动作，不作为输入或输出。"
    )

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("NaN")

    def process(
        self,
        mode: str = "常用尺寸",
        size_preset: str = "1024级",
        aspect_ratio: str = "1:1",
        width: int = 1024,
        height: int = 1024,
        scale_factor: float = 1.0,
    ):
        return calculate_resolution(
            mode,
            size_preset,
            aspect_ratio,
            width,
            height,
            scale_factor,
        )
