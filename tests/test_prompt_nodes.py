import json
import unittest

from prompt_nodes import (
    ElzaPromptHub_PromptBank,
    ElzaPromptHub_PromptMix,
    ElzaPromptHub_RandomPrompt,
    ElzaPromptHub_Resolution,
    calculate_resolution,
    render_mix_prompt,
)


def workflow_state(key, state, node_id=12):
    return {
        "workflow": {
            "nodes": [{"id": node_id, "properties": {key: json.dumps(state)}}]
        }
    }


class PromptBankNodeTests(unittest.TestCase):
    def test_selected_snapshots_apply_entry_weights(self):
        state = {
            "selected": [
                {"text_snapshot": "masterpiece", "weight": 1},
                {"text_snapshot": "cinematic lighting", "weight": 1.2},
            ]
        }
        node = ElzaPromptHub_PromptBank()
        result = node.process(
            "fallback",
            "high detail",
            1.0,
            unique_id="12",
            extra_pnginfo=workflow_state(node.STATE_PROPERTY, state),
        )
        self.assertEqual(
            result,
            ("masterpiece, (cinematic lighting:1.2), high detail",),
        )

    def test_entry_and_final_weights_can_be_combined(self):
        state = {"selected": [{"text_snapshot": "soft light", "weight": 1.1}]}
        node = ElzaPromptHub_PromptBank()
        result = node.process(
            "fallback",
            "",
            1.2,
            unique_id="12",
            extra_pnginfo=workflow_state(node.STATE_PROPERTY, state),
        )
        self.assertEqual(result, ("(((soft light:1.1)):1.2)",))

    def test_visible_summary_is_used_without_workflow_metadata(self):
        node = ElzaPromptHub_PromptBank()
        self.assertEqual(node.process("one, two", "", 1.0), ("one, two",))

    def test_final_weight_wraps_the_complete_bank_output(self):
        node = ElzaPromptHub_PromptBank()
        self.assertEqual(
            node.process("one, two", "three", 1.1),
            ("((one, two, three):1.1)",),
        )


class PromptMixNodeTests(unittest.TestCase):
    def test_mix_joins_one_saved_selection_per_secondary_tag(self):
        sections = [
            {
                "name": "人物",
                "collapsed": False,
                "groups": [
                    {
                        "name": "主体",
                        "selected": {
                            "name_snapshot": "单人女性",
                            "text_snapshot": "1girl",
                        },
                    },
                    {
                        "name": "光照",
                        "selected": {
                            "name_snapshot": "柔光",
                            "text_snapshot": "soft light",
                        },
                    },
                    {"name": "服装", "selected": None},
                ],
            },
        ]
        self.assertEqual(render_mix_prompt(sections), "1girl, soft light")
        self.assertEqual(
            render_mix_prompt(sections, 1.1),
            "((1girl, soft light):1.1)",
        )

    def test_node_reads_mixer_snapshot_from_properties(self):
        sections = [{
            "name": "画面",
            "collapsed": True,
            "groups": [{
                "name": "画风",
                "selected": {
                    "name_snapshot": "写实",
                    "text_snapshot": "realistic style",
                },
            }],
        }]
        node = ElzaPromptHub_PromptMix()
        result = node.process(
            1.0,
            unique_id="12",
            extra_pnginfo=workflow_state(node.STATE_PROPERTY, {"sections": sections}),
        )
        self.assertEqual(result, ("realistic style",))

    def test_mixer_node_only_exposes_final_weight(self):
        inputs = ElzaPromptHub_PromptMix.INPUT_TYPES()["required"]
        self.assertEqual(list(inputs), ["final_weight"])


class RandomPromptNodeTests(unittest.TestCase):
    def test_random_prompt_has_one_editable_prompt_and_probability_display(self):
        inputs = ElzaPromptHub_RandomPrompt.INPUT_TYPES()["required"]
        self.assertEqual(list(inputs), ["prompt", "probability_display"])
        self.assertTrue(inputs["prompt"][1]["multiline"])

    def test_plain_text_is_returned_unchanged(self):
        node = ElzaPromptHub_RandomPrompt()
        self.assertEqual(node.process("plain", "probability"), ("plain",))


class ResolutionNodeTests(unittest.TestCase):
    def test_common_preset_is_ratio_aware_and_aligned_to_eight(self):
        self.assertEqual(calculate_resolution("常用尺寸", "1024级", "16:9"), (1024, 576))

    def test_custom_resolution_is_aligned_and_can_swap(self):
        self.assertEqual(
            calculate_resolution("自定义", "1024级", "1:1", width=721, height=513),
            (720, 512),
        )

    def test_common_preset_supports_scale_factor(self):
        self.assertEqual(
            calculate_resolution(
                "常用尺寸",
                "1024级",
                "1:1",
                scale_factor=0.8,
            ),
            (816, 816),
        )

    def test_custom_resolution_ignores_scale_factor(self):
        self.assertEqual(
            calculate_resolution(
                "自定义",
                "1024级",
                "1:1",
                width=800,
                height=600,
                scale_factor=0.5,
            ),
            (800, 600),
        )

    def test_resolution_node_outputs_width_and_height(self):
        node = ElzaPromptHub_Resolution()
        self.assertEqual(node.process("常用尺寸", "512级", "3:2"), (512, 344))

    def test_resolution_node_declares_scale_factor(self):
        config = ElzaPromptHub_Resolution.INPUT_TYPES()["required"]["scale_factor"]
        self.assertEqual(config[0], "FLOAT")
        self.assertEqual(config[1]["default"], 1.0)

    def test_resolution_node_has_only_two_outputs(self):
        self.assertEqual(ElzaPromptHub_Resolution.RETURN_TYPES, ("INT", "INT"))


if __name__ == "__main__":
    unittest.main()
