from pathlib import Path
import unittest


SOURCE = (
    Path(__file__).resolve().parents[1] / "js" / "elza_custom_prompt_join.js"
).read_text(encoding="utf-8")
INIT_SOURCE = (Path(__file__).resolve().parents[1] / "__init__.py").read_text(
    encoding="utf-8"
)


class CustomPromptJoinFrontendStaticTests(unittest.TestCase):
    def test_node_is_registered(self):
        self.assertIn("ElzaPromptHub_CustomPromptJoin", INIT_SOURCE)
        self.assertIn('"Elza Custom Prompt Join"', INIT_SOURCE)

    def test_builds_dynamic_labeled_multiline_inputs(self):
        for token in [
            'const NODE_NAME = "ElzaPromptHub_CustomPromptJoin"',
            'const MAX_COUNT = 20',
            'const UPDATE_WIDGET = "更新"',
            "ComfyWidgets.STRING",
            "multiline: true",
            "node.addInput",
            "node.removeInput",
            "node.removeWidget",
            "LABEL_PREFIX",
            "TEXT_PREFIX",
            "separator",
            "random_mode",
            '{values: ["随机", "固定"]}',
            "applySeedMode",
            "seed",
            "step2: 1",
            "handleSeedChanged",
            "seedWidget.options.read_only = !fixed",
            "runtime_seed",
            "function createRuntimeSeed()",
            "beforeQueued",
            "prepareQueueSeed",
        ]:
            with self.subTest(token=token):
                self.assertIn(token, SOURCE)

    def test_persists_complex_state_in_workflow_properties(self):
        self.assertIn("node.properties[STATE_PROPERTY] = JSON.stringify(state)", SOURCE)
        self.assertIn("readPropertyState", SOURCE)
        self.assertIn("state.items", SOURCE)

    def test_uses_stable_input_names_and_updates_display_labels(self):
        self.assertIn('const TEXT_PREFIX = "text_"', SOURCE)
        self.assertIn("textWidget.label = label", SOURCE)
        self.assertIn("input.label = label", SOURCE)

    def test_connection_disables_only_the_multiline_editor(self):
        self.assertIn("applyConnectionState", SOURCE)
        self.assertIn("element.readOnly = connected", SOURCE)
        self.assertNotIn("labelWidget.disabled", SOURCE)

    def test_seed_stays_visible_but_is_read_only_in_random_mode(self):
        self.assertIn("seedWidget.disabled = false", SOURCE)
        self.assertIn("input.disabled = false", SOURCE)
        self.assertIn("input.readOnly = !fixed", SOURCE)
        self.assertIn("getWidget(node, \"random_mode\")?.value !== \"固定\"", SOURCE)
        self.assertIn("setWidgetValue(seedWidget, node._elzaCustomJoinSeedValue", SOURCE)

    def test_update_uses_change_tracking_and_deterministic_size(self):
        self.assertIn("app.graph?.beforeChange?.()", SOURCE)
        self.assertIn("app.graph?.afterChange?.()", SOURCE)
        self.assertIn("node.computeSize?.()", SOURCE)
        self.assertNotIn("Math.max(currentHeight", SOURCE)


if __name__ == "__main__":
    unittest.main()
