from .nodes import ElzaPromptHub_PromptSwitch, ElzaPromptHub_PromptBank

WEB_DIRECTORY = "./js"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

NODE_CLASS_MAPPINGS = {
    "ElzaPromptHub_PromptSwitch": ElzaPromptHub_PromptSwitch,
    "ElzaPromptHub_PromptBank": ElzaPromptHub_PromptBank,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ElzaPromptHub_PromptSwitch": "Elza Prompt Switch",
    "ElzaPromptHub_PromptBank": "Elza Prompt Bank",
}
