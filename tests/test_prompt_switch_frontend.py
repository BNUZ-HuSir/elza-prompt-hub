from pathlib import Path
import unittest


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
SWITCH_JS = PLUGIN_ROOT / "js" / "elza_prompt_switch.js"
LEGACY_JS = PLUGIN_ROOT / "js" / "elza_prompt_hub.js"


class PromptSwitchFrontendStaticTests(unittest.TestCase):
    def test_switch_uses_native_multiline_widgets_and_dynamic_inputs(self):
        source = SWITCH_JS.read_text(encoding="utf-8")
        self.assertIn('const STATE_PROPERTY = "elza_prompt_switch"', source)
        self.assertIn('import { ComfyWidgets }', source)
        self.assertIn("ComfyWidgets.STRING", source)
        self.assertIn("multiline: true", source)
        self.assertIn("node.addInput", source)
        self.assertIn("node.removeInput", source)
        self.assertIn("node.removeWidget(widget)", source)
        self.assertIn('"更新"', source)
        self.assertIn("onConnectionsChange", source)
        self.assertIn("trimPromptSlots", source)
        self.assertIn("fitNodeToPromptContent", source)
        self.assertIn("widget.element.disabled = connected", source)
        self.assertIn("widget: widgetLink", source)
        self.assertIn("beforeChange", source)
        self.assertIn("afterChange", source)

    def test_switch_does_not_build_a_second_prompt_editor(self):
        source = SWITCH_JS.read_text(encoding="utf-8")
        forbidden = [
            "elza-ps-inline",
            "elza-ps-list",
            "renderInlineEditor",
            'createElement("textarea"',
            'addDOMWidget(EDITOR_WIDGET_NAME',
        ]
        for token in forbidden:
            with self.subTest(token=token):
                self.assertNotIn(token, source)

    def test_switch_popup_editor_was_removed(self):
        source = SWITCH_JS.read_text(encoding="utf-8")
        forbidden = [
            "openEditor",
            "elza-ps-overlay",
            "elza-ps-dialog",
            '"编辑 Prompt"',
            '"确认"',
            '"取消"',
        ]
        for token in forbidden:
            with self.subTest(token=token):
                self.assertNotIn(token, source)

    def test_switch_does_not_use_unsafe_widget_mutation(self):
        source = SWITCH_JS.read_text(encoding="utf-8")
        forbidden = [
            '.type = "hidden"',
            "node.widgets.splice(",
            "node.widgets.pop(",
            "node.widgets.unshift(",
            "setSize(this.computeSize())",
            "onDrawForeground",
        ]
        for token in forbidden:
            with self.subTest(token=token):
                self.assertNotIn(token, source)

    def test_old_prompt_switch_patch_was_removed(self):
        source = LEGACY_JS.read_text(encoding="utf-8")
        self.assertNotIn("_elzaUpdateVisibility", source)
        self.assertNotIn("MAX_PROMPTS", source)
        self.assertNotIn('nodeData.name === "ElzaPromptHub_PromptSwitch"', source)


if __name__ == "__main__":
    unittest.main()
