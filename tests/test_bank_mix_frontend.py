from pathlib import Path
import unittest


SOURCE = (
    Path(__file__).resolve().parents[1] / "js" / "elza_prompt_hub.js"
).read_text(encoding="utf-8")


class BankMixFrontendStaticTests(unittest.TestCase):
    def test_registers_bank_mix_random_and_mixer_controls(self):
        for token in [
            "ElzaPromptHub_PromptBank",
            "ElzaPromptHub_PromptMix",
            "ElzaPromptHub_RandomPrompt",
            "ElzaPromptHub_Resolution",
            "另存词库备份",
            "全部展开",
            "全部收起",
            "刷新词库",
            "工作流保存",
            "addDOMWidget",
            "syntax/probabilities",
            "showSaveFilePicker",
            "CandidateEditor",
            "elza-ph-tabs",
            "elza-ph-subheader",
            "candidate-editor",
            "搜索中文名称或 Prompt",
            "文件管理",
            "立即保存",
            "syncResolutionWidgets",
            "swapResolutionWidgets",
            "交换宽高",
            "setResolutionWidgetVisible",
            "setResolutionWidgetEditable",
            "applyResolutionMode",
            "oldPreset",
            "openDocumentFolder",
            "打开文件夹",
        ]:
            with self.subTest(token=token):
                self.assertIn(token, SOURCE)

    def test_does_not_reorder_or_remove_widgets(self):
        forbidden = [
            ".widgets.pop(",
            ".widgets.unshift(",
            ".widgets.splice(",
            '.type = "hidden"',
            "setSize(this.computeSize())",
            ".innerHTML",
        ]
        for token in forbidden:
            with self.subTest(token=token):
                self.assertNotIn(token, SOURCE)

    def test_complex_state_uses_properties(self):
        self.assertIn("node.properties[key] = JSON.stringify(state)", SOURCE)
        self.assertIn("elza_prompt_bank_state", SOURCE)
        self.assertIn("elza_prompt_mix_state", SOURCE)

    def test_mixer_has_no_random_recipe_controls(self):
        self.assertNotIn("previewSeed", SOURCE)
        self.assertNotIn("换一个", SOURCE)
        self.assertNotIn("固定 / 随机", SOURCE)

    def test_mixer_uses_data_based_initial_height_and_collapsed_sections(self):
        self.assertIn("sectionCount", SOURCE)
        self.assertIn("expandedGroupCount", SOURCE)
        self.assertIn("targetHeight", SOURCE)
        self.assertNotIn("measuredPanelHeight", SOURCE)
        self.assertNotIn("this.container.scrollHeight || 0", SOURCE)
        self.assertNotIn("this.didFit", SOURCE)
        self.assertIn('container.addEventListener("wheel"', SOURCE)
        self.assertIn("container.scrollHeight > container.clientHeight", SOURCE)
        self.assertIn("height:100%;max-height:100%;min-height:0;overflow-y:auto", SOURCE)
        self.assertIn("collapsed: savedSection ? Boolean(savedSection.collapsed) : true", SOURCE)

    def test_mixer_can_switch_documents_and_preserve_missing_snapshot_state(self):
        self.assertIn("elza-mix-node-select", SOURCE)
        self.assertIn("document_missing", SOURCE)
        self.assertIn("markDocumentMissing", SOURCE)
        self.assertIn("refreshDeletedDocumentNodes", SOURCE)

    def test_name_based_data_model_rejects_duplicate_sibling_names(self):
        self.assertIn("hasSiblingName", SOURCE)
        self.assertIn("当前词库已有一级 Tag", SOURCE)
        self.assertIn("当前一级分组已有混合项", SOURCE)

    def test_bank_document_switch_preserves_selection_and_clear_has_undo(self):
        self.assertIn("switchDocument(documentId)", SOURCE)
        switch_body = SOURCE.split("async switchDocument(documentId)", 1)[1].split(
            "reconcileSelected()", 1
        )[0]
        self.assertNotIn("this.selected = []", switch_body)
        self.assertNotIn("this.undoSelection = null", switch_body)
        self.assertIn("deletingCurrentDocument", SOURCE)
        self.assertIn("undoClearSelected", SOURCE)

    def test_probability_preview_ignores_stale_requests(self):
        self.assertIn("requestVersion", SOURCE)
        self.assertIn("currentVersion !== requestVersion", SOURCE)

    def test_resolution_has_mode_visibility_and_button_swap(self):
        self.assertIn('for (const name of ["mode", "size_preset", "aspect_ratio", "scale_factor"])', SOURCE)
        self.assertIn('node.addWidget("button", "交换宽高"', SOURCE)
        self.assertIn('getWidget(node, "scale_factor")', SOURCE)
        self.assertIn('factorWidget.label = "系数"', SOURCE)
        self.assertNotIn('getWidget(node, "swap")', SOURCE)
        self.assertIn("widget.hidden = !visible", SOURCE)
        self.assertNotIn("widget.computeSize = visible", SOURCE)
        self.assertIn("Math.max(currentSize[0]", SOURCE)
        self.assertIn("minimumSize[1] || currentSize[1]", SOURCE)
        self.assertIn('values[0] === "自定义" && Boolean(RESOLUTION_RATIOS[values[1]])', SOURCE)

    def test_uses_custom_crud_dialogs_instead_of_browser_prompts(self):
        self.assertNotIn("prompt(", SOURCE)
        self.assertNotIn("confirm(", SOURCE)
        self.assertIn("formDialog(", SOURCE)
        self.assertIn("confirmDialog(", SOURCE)

    def test_bank_has_per_entry_weight_editor(self):
        self.assertIn("elza-ph-weight", SOURCE)
        self.assertIn("normalizeEntryWeight(item.weight)", SOURCE)

    def test_secondary_tags_use_context_menu_without_ellipsis(self):
        self.assertIn("tab.append(selectTab);", SOURCE)
        self.assertIn('head.append(element("div", "elza-ph-card-title", group.name), element("span", "elza-ph-count"', SOURCE)

    def test_bank_selected_cards_support_double_click_navigation(self):
        self.assertIn('row.addEventListener("dblclick"', SOURCE)
        self.assertIn("locateSelectedItem(item)", SOURCE)
        self.assertIn("工作流保存值（词库中已删除或改名）", SOURCE)


if __name__ == "__main__":
    unittest.main()
