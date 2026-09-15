import os
import tempfile
import unittest
import zipfile
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

import prompt_core
from prompt_core import (
    PromptDataConflict,
    PromptDataError,
    delete_document,
    export_document,
    export_documents_archive,
    import_document,
    list_documents,
    load_document,
    normalize_document,
    reveal_data_folder,
    save_document,
)


class PromptCoreStorageTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.plugin_root = Path(self.temp_dir.name) / "plugin"
        self.legacy_root = Path(self.temp_dir.name) / "legacy-user"
        self.env = patch.dict(
            os.environ,
            {
                "ELZA_PROMPT_HUB_DATA_DIR": str(self.plugin_root),
                "ELZA_PROMPT_HUB_LEGACY_DATA_DIR": str(self.legacy_root),
            },
        )
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.temp_dir.cleanup()

    def test_default_documents_use_plugin_relative_folders(self):
        documents = list_documents("bank")
        self.assertEqual(documents[0]["id"], "default-bank")
        document, revision = load_document("bank", "default-bank")
        self.assertEqual(document["kind"], "bank")
        self.assertTrue(revision)
        bank_dir = self.plugin_root / "wordbanks" / "promptbank"
        self.assertTrue(
            (bank_dir / "default-bank.yaml").exists()
        )
        yaml_text = (bank_dir / "default-bank.yaml").read_text(encoding="utf-8")
        self.assertNotIn("\nid:", f"\n{yaml_text}")

        list_documents("mix")
        self.assertTrue(
            (
                self.plugin_root
                / "wordbanks"
                / "promptmixer"
                / "default-mix.yaml"
            ).exists()
        )

    def test_external_user_data_is_copied_once_without_deleting_source(self):
        source_dir = self.legacy_root / "bank"
        source_dir.mkdir(parents=True)
        source = source_dir / "my-bank.yaml"
        source_text = (
            "version: 3\nkind: bank\nname: 旧用户词库\ncategories: []\n"
        )
        source.write_text(source_text, encoding="utf-8")

        documents = list_documents("bank")
        target = (
            self.plugin_root
            / "wordbanks"
            / "promptbank"
            / "my-bank.yaml"
        )
        self.assertEqual([item["id"] for item in documents], ["my-bank"])
        self.assertTrue(target.exists())
        self.assertEqual(source.read_text(encoding="utf-8"), source_text)

        list_documents("bank")
        self.assertEqual(
            len(list((self.plugin_root / "wordbanks" / "promptbank").glob("*.yaml"))),
            1,
        )

    def test_external_migration_preserves_both_files_on_name_conflict(self):
        save_document(
            "bank",
            {"id": "my-bank", "name": "插件内词库", "categories": []},
        )
        source_dir = self.legacy_root / "bank"
        source_dir.mkdir(parents=True)
        source = source_dir / "my-bank.yaml"
        source.write_text(
            "version: 3\nkind: bank\nname: 旧用户词库\ncategories: []\n",
            encoding="utf-8",
        )

        documents = list_documents("bank")
        ids = {item["id"] for item in documents}
        self.assertEqual(ids, {"my-bank", "my-bank-migrated"})
        migrated, _ = load_document("bank", "my-bank-migrated")
        self.assertEqual(migrated["name"], "旧用户词库（从旧用户目录迁移）")
        self.assertTrue(source.exists())

    def test_atomic_save_detects_revision_conflict(self):
        document = {
            "id": "custom-bank",
            "name": "自定义",
            "categories": [],
        }
        saved, revision = save_document("bank", document)
        stored = (
            self.plugin_root / "wordbanks" / "promptbank" / "custom-bank.yaml"
        ).read_text(encoding="utf-8")
        self.assertNotIn("\nid:", f"\n{stored}")
        saved["name"] = "新名称"
        save_document("bank", saved, revision)
        with self.assertRaises(PromptDataConflict):
            save_document("bank", saved, revision)

    def test_save_rejects_duplicate_names_without_ids(self):
        duplicate_bank = {
            "id": "duplicate-bank",
            "name": "重复测试",
            "categories": [
                {"name": "人物", "children": []},
                {"name": " 人物 ", "children": []},
            ],
        }
        with self.assertRaisesRegex(PromptDataError, "重复名称"):
            save_document("bank", duplicate_bank)

        duplicate_mix = {
            "id": "duplicate-mix",
            "name": "重复测试",
            "categories": [{
                "name": "人物",
                "children": [
                    {"name": "发型", "entries": []},
                    {"name": "发型", "entries": []},
                ],
            }],
        }
        with self.assertRaisesRegex(PromptDataError, "重复名称"):
            save_document("mix", duplicate_mix)

    def test_backup_is_returned_as_zip_without_creating_backup_file(self):
        list_documents("mix")
        content, filename = export_documents_archive("mix")
        self.assertTrue(filename.endswith(".zip"))
        with zipfile.ZipFile(BytesIO(content)) as archive:
            self.assertIn("default-mix.yaml", archive.namelist())
            self.assertIn("manifest.json", archive.namelist())

    def test_reveal_data_folder_uses_current_document_directory(self):
        list_documents("bank")
        load_document("bank", "default-bank")
        with patch.object(prompt_core.subprocess, "Popen") as popen:
            folder = reveal_data_folder("bank", "default-bank")
        self.assertEqual(
            folder, self.plugin_root / "wordbanks" / "promptbank"
        )
        popen.assert_called_once()
        self.assertEqual(popen.call_args.args[0][0], "explorer.exe" if os.name == "nt" else "xdg-open")

    def test_import_export_and_delete_document(self):
        source = "version: 3\nkind: bank\nname: 导入词库\ncategories: []\n"
        document, revision = import_document("bank", source, "my-bank.yaml")
        self.assertEqual(document["id"], "my-bank")
        self.assertTrue(revision)
        exported, filename = export_document("bank", "my-bank")
        self.assertEqual(filename, "my-bank.yaml")
        self.assertIn("导入词库", exported.decode("utf-8"))
        delete_document("bank", "my-bank")
        self.assertFalse(
            (
                self.plugin_root
                / "wordbanks"
                / "promptbank"
                / "my-bank.yaml"
            ).exists()
        )

    def test_import_does_not_overwrite_same_filename(self):
        source = "version: 3\nkind: mix\nname: 配方\ncategories: []\n"
        first, _ = import_document("mix", source, "recipe.yaml")
        second, _ = import_document("mix", source, "recipe.yaml")
        self.assertEqual(first["id"], "recipe")
        self.assertEqual(second["id"], "recipe-2")

    def test_multiple_legacy_wordbanks_migrate_without_modifying_sources(self):
        plugin_root = Path(self.temp_dir.name) / "legacy-plugin"
        plugin_root.mkdir()
        first = plugin_root / "wordbank.yaml"
        second = plugin_root / "wordbankX.yaml"
        example = plugin_root / "wordbank-example.yaml"
        content = "人物:\n  基础:\n    - 女性|1girl\n"
        first.write_text(content, encoding="utf-8")
        second.write_text(content.replace("女性", "男性").replace("1girl", "1boy"), encoding="utf-8")
        example.write_text(content, encoding="utf-8")

        with patch.object(prompt_core, "PLUGIN_DIR", plugin_root):
            documents = list_documents("bank")

        self.assertEqual(len(documents), 2)
        self.assertEqual(first.read_text(encoding="utf-8"), content)
        self.assertTrue(second.exists())
        self.assertTrue(example.exists())

    def test_mix_v2_is_migrated_without_nested_ids_or_random_fields(self):
        document = normalize_document("mix", {
            "id": "legacy-mix",
            "name": "旧配方",
            "groups": [{
                "id": "group-light",
                "name": "光照",
                "mode": "random",
                "candidates": [{
                    "id": "candidate-soft",
                    "name": "柔光",
                    "text": "soft light",
                    "weight": 2,
                }],
            }],
        })
        self.assertEqual(document["version"], 3)
        self.assertEqual(
            document["categories"][0]["children"][0]["entries"],
            [{"name": "柔光", "text": "soft light"}],
        )
        serialized = prompt_core._serialize(document)
        self.assertNotIn("candidate-soft", serialized)
        self.assertNotIn("weight:", serialized)
        self.assertNotIn("mode:", serialized)

    def test_bank_normalization_removes_nested_ids(self):
        document = normalize_document("bank", {
            "id": "bank-with-ids",
            "name": "词库",
            "categories": [{
                "id": "category-person",
                "name": "人物",
                "children": [{
                    "id": "group-hair",
                    "name": "发型",
                    "entries": [{
                        "id": "entry-long",
                        "name": "黑色长发",
                        "text": "long black hair",
                    }],
                }],
            }],
        })
        entry = document["categories"][0]["children"][0]["entries"][0]
        self.assertEqual(entry, {"name": "黑色长发", "text": "long black hair", "aliases": []})
        self.assertNotIn("category-person", prompt_core._serialize(document))


if __name__ == "__main__":
    unittest.main()
