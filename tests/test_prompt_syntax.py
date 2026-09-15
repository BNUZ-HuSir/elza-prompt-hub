import random
import unittest

from prompt_syntax import (
    DynamicPromptSyntaxError,
    analyze_probabilities,
    parse_dynamic,
    validate_dynamic_syntax,
)


class FixedRandom:
    def __init__(self, *values):
        self._values = iter(values)

    def random(self):
        return next(self._values)


class PromptSyntaxTests(unittest.TestCase):
    def test_plain_text_is_unchanged(self):
        self.assertEqual(parse_dynamic("plain prompt"), "plain prompt")

    def test_basic_variant_selects_one_option(self):
        self.assertEqual(parse_dynamic("{a|b|c}", FixedRandom(0.0)), "a")
        self.assertEqual(parse_dynamic("{a|b|c}", FixedRandom(0.99)), "c")

    def test_weighted_variant_uses_relative_weights(self):
        self.assertEqual(parse_dynamic("{0.5::a|1.5::b}", FixedRandom(0.249)), "a")
        self.assertEqual(parse_dynamic("{0.5::a|1.5::b}", FixedRandom(0.25)), "b")

    def test_multi_select_is_unique_and_randomly_ordered(self):
        result = parse_dynamic("{2$$a|b|c}", random.Random(2)).split(", ")
        self.assertEqual(len(result), 2)
        self.assertEqual(len(set(result)), 2)
        self.assertTrue(set(result).issubset({"a", "b", "c"}))

    def test_multi_select_count_is_capped_to_available_options(self):
        result = parse_dynamic("{5$$a|b}", random.Random(3)).split(", ")
        self.assertCountEqual(result, ["a", "b"])

    def test_empty_option_is_valid(self):
        self.assertEqual(parse_dynamic("before{a|}after", FixedRandom(0.99)), "beforeafter")

    def test_multiple_variants_are_expanded(self):
        self.assertEqual(
            parse_dynamic("{red|blue} {cat|dog}", FixedRandom(0.0, 0.99)),
            "red dog",
        )

    def test_invalid_structures_raise_clear_errors(self):
        invalid_values = [
            "{a|b",
            "a|b}",
            "{{a|b}|c}",
            "{0$$a|b}",
            "{x$$a|b}",
            "{abc::a|b}",
            "{0::a|0::b}",
            "{1e309::a|b}",
        ]
        for value in invalid_values:
            with self.subTest(value=value):
                with self.assertRaises(DynamicPromptSyntaxError):
                    validate_dynamic_syntax(value)

    def test_probability_analysis_matches_weighted_single_selection(self):
        analysis = analyze_probabilities("{0.5::a|1.5::b}")
        options = analysis["blocks"][0]["options"]
        self.assertAlmostEqual(options[0]["probability"], 0.25)
        self.assertAlmostEqual(options[1]["probability"], 0.75)

    def test_probability_analysis_handles_unique_multi_selection(self):
        analysis = analyze_probabilities("{2$$a|b|c}")
        probabilities = [
            option["probability"]
            for option in analysis["blocks"][0]["options"]
        ]
        for probability in probabilities:
            self.assertAlmostEqual(probability, 2 / 3)

    def test_probability_analysis_preserves_empty_option(self):
        options = analyze_probabilities("{a|}")["blocks"][0]["options"]
        self.assertEqual(options[1]["text"], "")
        self.assertAlmostEqual(options[1]["probability"], 0.5)

    def test_large_equal_weight_multi_selection_uses_direct_probability(self):
        options_text = "|".join(f"item-{index}" for index in range(1000))
        block = analyze_probabilities("{2" + "$$" + options_text + "}")["blocks"][0]
        self.assertFalse(block["approximate"])
        self.assertEqual(len(block["options"]), 1000)
        self.assertAlmostEqual(block["options"][0]["probability"], 0.002)
        self.assertAlmostEqual(block["options"][-1]["probability"], 0.002)

    def test_large_weighted_multi_selection_degrades_before_state_explosion(self):
        options_text = "|".join(
            f"{index + 1}::item-{index}" for index in range(400)
        )
        block = analyze_probabilities("{2" + "$$" + options_text + "}")["blocks"][0]
        self.assertTrue(block["approximate"])
        self.assertEqual(len(block["options"]), 400)

    def test_zero_weight_option_never_appears_when_all_positive_options_selected(self):
        options = analyze_probabilities("{2$$1::a|1::b|0::never}")["blocks"][0]["options"]
        self.assertEqual([item["probability"] for item in options], [1.0, 1.0, 0.0])


if __name__ == "__main__":
    unittest.main()
