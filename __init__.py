from .nodes import ElzaPromptHub_CustomPromptJoin, ElzaPromptHub_PromptSwitch
from .prompt_nodes import (
    ElzaPromptHub_PromptBank,
    ElzaPromptHub_PromptMix,
    ElzaPromptHub_RandomPrompt,
    ElzaPromptHub_Resolution,
)
from . import prompt_api as _prompt_api  # noqa: F401 — 导入时注册本地 API

WEB_DIRECTORY = "./js"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

NODE_CLASS_MAPPINGS = {
    "ElzaPromptHub_PromptSwitch": ElzaPromptHub_PromptSwitch,
    "ElzaPromptHub_CustomPromptJoin": ElzaPromptHub_CustomPromptJoin,
    "ElzaPromptHub_PromptBank": ElzaPromptHub_PromptBank,
    "ElzaPromptHub_PromptMix": ElzaPromptHub_PromptMix,
    "ElzaPromptHub_RandomPrompt": ElzaPromptHub_RandomPrompt,
    "ElzaPromptHub_Resolution": ElzaPromptHub_Resolution,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ElzaPromptHub_PromptSwitch": "Elza Prompt Switch",
    "ElzaPromptHub_CustomPromptJoin": "Elza Custom Prompt Join",
    "ElzaPromptHub_PromptBank": "Elza Prompt Bank",
    "ElzaPromptHub_PromptMix": "Elza Prompt Mixer",
    "ElzaPromptHub_RandomPrompt": "Elza Random Prompt",
    "ElzaPromptHub_Resolution": "Elza Image Resolution",
}
