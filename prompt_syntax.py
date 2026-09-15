"""Elza Prompt Hub 的轻量随机 Prompt 语法解析器。

本模块独立实现了 ``dynamicprompts`` 项目 Variant 语法的一个小型兼容子集：

- ``{a|b|c}``：随机单选
- ``{0.5::a|1.5::b}``：带权随机
- ``{2$$a|b|c}``：无重复多选
- ``{a|}``：合法空选项

语法参考与第三方声明见 ``THIRD_PARTY_NOTICES.md``。本项目不依赖或打包
``dynamicprompts`` Python 包。
"""

from __future__ import annotations

import math
import random
import re
from dataclasses import dataclass
from typing import Any, Protocol


class RandomSource(Protocol):
    """解析器需要的最小随机数接口。"""

    def random(self) -> float:
        """返回 [0.0, 1.0) 范围内的随机数。"""


class DynamicPromptSyntaxError(ValueError):
    """随机 Prompt 语法无效。"""


@dataclass(frozen=True)
class _WeightedOption:
    text: str
    weight: float


_MULTI_PREFIX_RE = re.compile(r"^\s*(\d+)\$\$(.*)$", re.DOTALL)
_WEIGHT_PREFIX_RE = re.compile(
    r"^\s*((?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)::(.*)$",
    re.DOTALL,
)


def _find_variants(text: str) -> list[tuple[int, int, str]]:
    """返回 ``(start, end, content)``，并拒绝嵌套或不配对花括号。"""

    variants: list[tuple[int, int, str]] = []
    open_index: int | None = None

    for index, char in enumerate(text):
        if char == "{":
            if open_index is not None:
                raise DynamicPromptSyntaxError(
                    f"不支持嵌套随机语法（位置 {open_index} 和 {index}）"
                )
            open_index = index
        elif char == "}":
            if open_index is None:
                raise DynamicPromptSyntaxError(f"存在未配对的 '}}'（位置 {index}）")
            variants.append((open_index, index + 1, text[open_index + 1:index]))
            open_index = None

    if open_index is not None:
        raise DynamicPromptSyntaxError(f"存在未配对的 '{{'（位置 {open_index}）")

    return variants


def _parse_option(raw_option: str) -> _WeightedOption:
    option = raw_option.strip()
    match = _WEIGHT_PREFIX_RE.match(option)
    if match:
        weight = float(match.group(1))
        text = match.group(2).strip()
    else:
        if "::" in option:
            raise DynamicPromptSyntaxError(
                f"无效的权重写法：{raw_option!r}，正确示例为 0.5::text"
            )
        weight = 1.0
        text = option

    if not math.isfinite(weight):
        raise DynamicPromptSyntaxError("随机权重必须是有限数字")
    if weight < 0:
        raise DynamicPromptSyntaxError("随机权重不能为负数")
    return _WeightedOption(text=text, weight=weight)


def _weighted_index(options: list[_WeightedOption], rng: RandomSource) -> int:
    total_weight = sum(option.weight for option in options)
    if total_weight <= 0:
        raise DynamicPromptSyntaxError("同一个随机块中至少需要一个大于 0 的权重")

    threshold = rng.random() * total_weight
    cumulative = 0.0
    last_positive_index = 0
    for index, option in enumerate(options):
        if option.weight > 0:
            last_positive_index = index
        cumulative += option.weight
        if threshold < cumulative:
            return index
    return last_positive_index


def _render_variant(content: str, rng: RandomSource) -> str:
    selection_count = 1
    options_text = content

    multi_match = _MULTI_PREFIX_RE.match(content)
    if multi_match:
        selection_count = int(multi_match.group(1))
        options_text = multi_match.group(2)
        if selection_count < 1:
            raise DynamicPromptSyntaxError("多选数量必须大于 0")
    elif "$$" in content:
        raise DynamicPromptSyntaxError(
            f"无效的多选写法：{{{content}}}，正确示例为 {{2$$a|b|c}}"
        )

    options = [_parse_option(raw_option) for raw_option in options_text.split("|")]
    if not options:
        return ""

    selection_count = min(selection_count, len(options))
    positive_count = sum(option.weight > 0 for option in options)
    if selection_count > positive_count:
        raise DynamicPromptSyntaxError(
            "多选数量不能超过权重大于 0 的选项数量"
        )
    remaining = list(options)
    chosen: list[str] = []

    for _ in range(selection_count):
        chosen_index = _weighted_index(remaining, rng)
        chosen.append(remaining.pop(chosen_index).text)

    return ", ".join(chosen)


def validate_dynamic_syntax(text: str) -> None:
    """只验证结构和选项配置，不消耗随机数。"""

    for _, _, content in _find_variants(str(text)):
        multi_match = _MULTI_PREFIX_RE.match(content)
        if multi_match:
            if int(multi_match.group(1)) < 1:
                raise DynamicPromptSyntaxError("多选数量必须大于 0")
            options_text = multi_match.group(2)
        else:
            if "$$" in content:
                raise DynamicPromptSyntaxError(
                    f"无效的多选写法：{{{content}}}，正确示例为 {{2$$a|b|c}}"
                )
            options_text = content

        options = [_parse_option(raw_option) for raw_option in options_text.split("|")]
        if sum(option.weight for option in options) <= 0:
            raise DynamicPromptSyntaxError("同一个随机块中至少需要一个大于 0 的权重")
        selection_count = min(
            int(multi_match.group(1)) if multi_match else 1,
            len(options),
        )
        if selection_count > sum(option.weight > 0 for option in options):
            raise DynamicPromptSyntaxError(
                "多选数量不能超过权重大于 0 的选项数量"
            )


def parse_dynamic(text: str, rng: RandomSource | None = None) -> str:
    """展开文本中的随机 Variant 语法。

    Args:
        text: 待解析文本。
        rng: 可选随机源，测试时可传入 ``random.Random`` 实例。
    """

    source = str(text)
    variants = _find_variants(source)
    if not variants:
        return source

    random_source: RandomSource = rng if rng is not None else random
    output: list[str] = []
    cursor = 0
    for start, end, content in variants:
        output.append(source[cursor:start])
        output.append(_render_variant(content, random_source))
        cursor = end
    output.append(source[cursor:])
    return "".join(output)


def _selection_probabilities(
    options: list[_WeightedOption], selection_count: int
) -> tuple[list[float], bool]:
    """计算无放回抽取时每个选项至少出现一次的概率。

    常见 Prompt 随机块只有少量选项，使用状态概率可以得到精确结果。为避免
    极端输入拖慢实时 UI，状态超过 50,000 时退化为带明确标记的近似值。
    """

    selection_count = min(selection_count, len(options))
    positive_indices = [
        index for index, option in enumerate(options) if option.weight > 0
    ]
    positive_count = len(positive_indices)
    if selection_count >= positive_count:
        return (
            [1.0 if option.weight > 0 else 0.0 for option in options],
            False,
        )

    positive_weights = [options[index].weight for index in positive_indices]
    first_weight = positive_weights[0]
    if all(
        math.isclose(weight, first_weight, rel_tol=1e-12, abs_tol=1e-12)
        for weight in positive_weights[1:]
    ):
        probability = selection_count / positive_count
        return (
            [probability if option.weight > 0 else 0.0 for option in options],
            False,
        )

    def approximate_probabilities() -> tuple[list[float], bool]:
        total_weight = sum(option.weight for option in options)
        estimates = [
            min(1.0, selection_count * option.weight / total_weight)
            for option in options
        ]
        return (estimates, True)

    # 状态枚举的规模约为 C(n, k)。必须在创建 next_states 之前判断，
    # 否则上千个选项会先构造数百万状态，再进入原来的降级分支，阻塞 UI。
    if math.comb(positive_count, selection_count) > 50_000:
        return approximate_probabilities()

    states: dict[int, float] = {0: 1.0}
    approximate = False
    for _ in range(selection_count):
        next_states: dict[int, float] = {}
        for mask, state_probability in states.items():
            available = [
                index
                for index, option in enumerate(options)
                if not mask & (1 << index) and option.weight > 0
            ]
            total_weight = sum(options[index].weight for index in available)
            if total_weight <= 0:
                continue
            for index in available:
                next_mask = mask | (1 << index)
                probability = (
                    state_probability * options[index].weight / total_weight
                )
                next_states[next_mask] = next_states.get(next_mask, 0.0) + probability
        states = next_states
        if len(states) > 50_000:
            approximate = True
            break

    if approximate:
        return approximate_probabilities()

    inclusion = [0.0] * len(options)
    for mask, probability in states.items():
        for index in range(len(options)):
            if mask & (1 << index):
                inclusion[index] += probability
    return (inclusion, False)


def analyze_probabilities(text: str) -> dict[str, Any]:
    """返回随机块中每个选项的出现概率，供节点实时预览使用。"""

    source = str(text)
    variants = _find_variants(source)
    blocks: list[dict[str, Any]] = []

    for block_index, (start, end, content) in enumerate(variants, start=1):
        selection_count = 1
        options_text = content
        multi_match = _MULTI_PREFIX_RE.match(content)
        if multi_match:
            selection_count = int(multi_match.group(1))
            if selection_count < 1:
                raise DynamicPromptSyntaxError("多选数量必须大于 0")
            options_text = multi_match.group(2)
        elif "$$" in content:
            raise DynamicPromptSyntaxError(
                f"无效的多选写法：{{{content}}}，正确示例为 {{2$$a|b|c}}"
            )

        options = [_parse_option(raw) for raw in options_text.split("|")]
        if sum(option.weight for option in options) <= 0:
            raise DynamicPromptSyntaxError("同一个随机块中至少需要一个大于 0 的权重")
        selection_count = min(selection_count, len(options))
        if selection_count > sum(option.weight > 0 for option in options):
            raise DynamicPromptSyntaxError(
                "多选数量不能超过权重大于 0 的选项数量"
            )

        probabilities, approximate = _selection_probabilities(
            options, selection_count
        )
        blocks.append({
            "index": block_index,
            "source": source[start:end],
            "selection_count": min(selection_count, len(options)),
            "approximate": approximate,
            "options": [
                {
                    "text": option.text,
                    "weight": option.weight,
                    "probability": probabilities[index],
                }
                for index, option in enumerate(options)
            ],
        })

    return {
        "valid": True,
        "has_random_syntax": bool(blocks),
        "blocks": blocks,
    }
