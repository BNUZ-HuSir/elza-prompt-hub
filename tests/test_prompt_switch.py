import json
import math
import unittest

from nodes import ElzaPromptHub_PromptSwitch, _FlexiblePromptInputs


def workflow_state(properties, node_id=7):
    return {
        "workflow": {
            "nodes": [
                {
                    "id": node_id,
                    "properties": properties,
                }
            ]
        }
    }


class FlexibleInputsTests(unittest.TestCase):
    def test_dynamic_prompt_inputs_are_accepted(self):
        inputs = _FlexiblePromptInputs()
        self.assertIn("prompt_0", inputs)
        self.assertIn("prompt_98", inputs)
        self.assertNotIn("count", inputs)
        self.assertNotIn("prompt_x", inputs)
        self.assertEqual(inputs["prompt_12"][0], "STRING")
        self.assertTrue(inputs["prompt_12"][1]["forceInput"])


class PromptSwitchTests(unittest.TestCase):
    def setUp(self):
        self.node = ElzaPromptHub_PromptSwitch()

    def test_input_types_create_native_index_and_count_widgets(self):
        inputs = self.node.INPUT_TYPES()
        self.assertEqual(list(inputs["required"]), ["index", "count"])
        self.assertEqual(inputs["required"]["count"][0], "INT")
        self.assertEqual(inputs["required"]["count"][1]["default"], 3)
        self.assertEqual(inputs["required"]["count"][1]["min"], 1)
        self.assertEqual(inputs["required"]["count"][1]["max"], 99)
        self.assertEqual(list(inputs["optional"]), [])
        self.assertEqual(inputs["hidden"]["unique_id"], "UNIQUE_ID")
        self.assertEqual(inputs["hidden"]["extra_pnginfo"], "EXTRA_PNGINFO")

    def test_reads_versioned_local_state(self):
        state = json.dumps({"version": 1, "count": 3, "prompts": ["zero", "one", ""]})
        result = self.node.process(
            1,
            unique_id=["7"],
            extra_pnginfo=[workflow_state({"elza_prompt_switch": state})],
        )
        self.assertEqual(result, ("one",))

    def test_state_count_preserves_trailing_empty_slots(self):
        state = {"version": 1, "count": 5, "prompts": ["zero", "one"]}
        prompts = self.node._load_local_prompts(
            "7",
            workflow_state({"elza_prompt_switch": state}),
        )
        self.assertEqual(prompts, ["zero", "one", "", "", ""])

    def test_reads_legacy_property(self):
        result = self.node.process(
            0,
            unique_id="7",
            extra_pnginfo=workflow_state({"elza_prompts": json.dumps(["legacy"])}, 7),
        )
        self.assertEqual(result, ("legacy",))

    def test_connected_value_overrides_local_value(self):
        state = {"version": 1, "count": 1, "prompts": ["local"]}
        result = self.node.process(
            0,
            unique_id="7",
            extra_pnginfo=workflow_state({"elza_prompt_switch": state}),
            prompt_0="connected",
        )
        self.assertEqual(result, ("connected",))

    def test_connected_empty_string_still_overrides_local_value(self):
        state = {"version": 1, "count": 1, "prompts": ["local"]}
        result = self.node.process(
            0,
            unique_id="7",
            extra_pnginfo=workflow_state({"elza_prompt_switch": state}),
            prompt_0="",
        )
        self.assertEqual(result, ("",))

    def test_connected_high_index_extends_runtime_slot_count(self):
        result = self.node.process(8, prompt_8="connected")
        self.assertEqual(result, ("connected",))

    def test_new_node_has_three_empty_local_slots(self):
        self.assertEqual(self.node.process(2), ("",))
        with self.assertRaisesRegex(ValueError, "超出有效范围"):
            self.node.process(3, count=3)

    def test_count_defines_empty_slots_without_workflow_properties(self):
        self.assertEqual(self.node.process(7, count=8), ("",))
        with self.assertRaisesRegex(ValueError, "超出有效范围"):
            self.node.process(8, count=8)

    def test_random_syntax_error_identifies_prompt_index(self):
        with self.assertRaisesRegex(ValueError, "Prompt 0 随机语法错误"):
            self.node.process(0, prompt_0="{a|b")

    def test_validation_and_cache_policy(self):
        self.assertIs(self.node.VALIDATE_INPUTS(0, 3), True)
        self.assertIsInstance(self.node.VALIDATE_INPUTS(-1, 3), str)
        self.assertIsInstance(self.node.VALIDATE_INPUTS(99, 3), str)
        self.assertIsInstance(self.node.VALIDATE_INPUTS(0, 0), str)
        self.assertIsInstance(self.node.VALIDATE_INPUTS(0, 100), str)
        self.assertTrue(math.isnan(self.node.IS_CHANGED()))


if __name__ == "__main__":
    unittest.main()
