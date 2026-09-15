import json
import math
import unittest
from unittest.mock import patch

from nodes import ElzaPromptHub_CustomPromptJoin, _FlexibleJoinInputs


class FixedRandom:
    def __init__(self, value):
        self.value = value

    def random(self):
        return self.value


def workflow_state(state, node_id=17):
    return {
        "workflow": {
            "nodes": [
                {
                    "id": node_id,
                    "properties": {
                        "elza_custom_prompt_join": json.dumps(state),
                    },
                }
            ]
        }
    }


class FlexibleJoinInputsTests(unittest.TestCase):
    def test_accepts_only_supported_dynamic_text_inputs(self):
        inputs = _FlexibleJoinInputs()
        self.assertIn("text_0", inputs)
        self.assertIn("text_19", inputs)
        self.assertNotIn("text_20", inputs)
        self.assertNotIn("text_x", inputs)
        self.assertTrue(inputs["text_4"][1]["forceInput"])


class CustomPromptJoinTests(unittest.TestCase):
    def setUp(self):
        self.node = ElzaPromptHub_CustomPromptJoin()

    def test_declares_count_and_dynamic_string_inputs(self):
        inputs = self.node.INPUT_TYPES()
        self.assertEqual(list(inputs["required"]), ["count"])
        self.assertEqual(inputs["required"]["count"][1]["default"], 3)
        self.assertEqual(inputs["required"]["count"][1]["max"], 20)
        self.assertEqual(list(inputs["optional"]), [])

    def test_joins_local_text_and_skips_empty_items(self):
        state = {
            "count": 3,
            "separator": " | ",
            "random_mode": "固定",
            "seed": 8,
            "items": [
                {"label": "人物", "text": "1girl"},
                {"label": "空项", "text": "   "},
                {"label": "服装", "text": "red dress"},
            ],
        }
        result = self.node.process(
            3,
            unique_id="17",
            extra_pnginfo=workflow_state(state),
        )
        self.assertEqual(result, ("1girl | red dress",))

    def test_connected_value_overrides_local_text(self):
        state = {
            "count": 1,
            "separator": ", ",
            "random_mode": "固定",
            "seed": 0,
            "items": [{"label": "人物", "text": "local"}],
        }
        result = self.node.process(
            1,
            unique_id=17,
            extra_pnginfo=[workflow_state(state)],
            text_0="connected",
        )
        self.assertEqual(result, ("connected",))

    def test_each_non_empty_item_expands_random_syntax_with_one_seed(self):
        state = {
            "count": 2,
            "separator": ", ",
            "random_mode": "固定",
            "seed": 22,
            "items": [
                {"label": "颜色", "text": "{red|blue}"},
                {"label": "主体", "text": "{cat|dog}"},
            ],
        }
        first = self.node.process(2, unique_id=17, extra_pnginfo=workflow_state(state))
        second = self.node.process(2, unique_id=17, extra_pnginfo=workflow_state(state))
        self.assertEqual(first, second)
        self.assertRegex(first[0], r"^(red|blue), (cat|dog)$")

    def test_random_empty_result_is_skipped_without_extra_separator(self):
        state = {
            "count": 2,
            "separator": ", ",
            "random_mode": "固定",
            "seed": 0,
            "items": [
                {"label": "可空", "text": "{a|}"},
                {"label": "固定", "text": "tail"},
            ],
        }
        self.assertEqual(
            self.node.process(2, unique_id=17, extra_pnginfo=workflow_state(state)),
            ("tail",),
        )

    def test_applied_state_count_is_authoritative(self):
        state = {
            "count": 1,
            "separator": ", ",
            "random_mode": "固定",
            "seed": 0,
            "items": [{"label": "一", "text": "one"}],
        }
        result = self.node.process(
            4,
            unique_id=17,
            extra_pnginfo=workflow_state(state),
            text_1="not-applied",
        )
        self.assertEqual(result, ("one",))

    def test_syntax_error_uses_custom_label(self):
        state = {
            "count": 1,
            "separator": ", ",
            "random_mode": "固定",
            "seed": 0,
            "items": [{"label": "镜头", "text": "{wide|close"}],
        }
        with self.assertRaisesRegex(ValueError, "镜头.*随机语法错误"):
            self.node.process(1, unique_id=17, extra_pnginfo=workflow_state(state))

    def test_random_mode_uses_fresh_system_random_source(self):
        state = {
            "count": 1,
            "separator": ", ",
            "random_mode": "随机",
            "seed": 0,
            "items": [{"label": "颜色", "text": "{red|blue}"}],
        }
        with patch("nodes.random.SystemRandom", return_value=FixedRandom(0.99)) as factory:
            result = self.node.process(1, unique_id=17, extra_pnginfo=workflow_state(state))
        self.assertEqual(result, ("blue",))
        factory.assert_called_once_with()

    def test_random_mode_runtime_seed_drives_shared_reproducible_sequence(self):
        state = {
            "count": 2,
            "separator": ", ",
            "random_mode": "\u968f\u673a",
            "seed": 0,
            "runtime_seed": 123456,
            "items": [
                {"label": "color", "text": "{red|green|blue}"},
                {"label": "subject", "text": "{cat|dog|bird}"},
            ],
        }
        with patch("nodes.random.SystemRandom") as factory:
            first = self.node.process(2, unique_id=17, extra_pnginfo=workflow_state(state))
            second = self.node.process(2, unique_id=17, extra_pnginfo=workflow_state(state))
        self.assertEqual(first, second)
        self.assertRegex(first[0], r"^(red|green|blue), (cat|dog|bird)$")
        factory.assert_not_called()

    def test_fixed_mode_does_not_use_system_random(self):
        state = {
            "count": 1,
            "separator": ", ",
            "random_mode": "固定",
            "seed": 7,
            "items": [{"label": "颜色", "text": "{red|blue}"}],
        }
        with patch("nodes.random.SystemRandom") as factory:
            first = self.node.process(1, unique_id=17, extra_pnginfo=workflow_state(state))
            second = self.node.process(1, unique_id=17, extra_pnginfo=workflow_state(state))
        self.assertEqual(first, second)
        factory.assert_not_called()

    def test_validation_and_cache_policy(self):
        self.assertIs(self.node.VALIDATE_INPUTS(1), True)
        self.assertIs(self.node.VALIDATE_INPUTS(20), True)
        self.assertIsInstance(self.node.VALIDATE_INPUTS(0), str)
        self.assertIsInstance(self.node.VALIDATE_INPUTS(21), str)
        self.assertTrue(math.isnan(self.node.IS_CHANGED()))


if __name__ == "__main__":
    unittest.main()
