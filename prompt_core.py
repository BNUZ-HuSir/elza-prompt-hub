"""Prompt Bank / Prompt Mix 共用的数据、状态与拼接服务。"""

from __future__ import annotations

import hashlib
import io
import json
import os
import re
import tempfile
import zipfile
import subprocess
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

import yaml


PLUGIN_DIR = Path(__file__).resolve().parent
DATA_KINDS = {"bank", "mix"}
DATA_RELATIVE_DIRS = {
    "bank": Path("wordbanks") / "promptbank",
    "mix": Path("wordbanks") / "promptmixer",
}
_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")


class PromptDataError(ValueError):
    """用户数据无效或发生保存冲突。"""


class PromptDataConflict(PromptDataError):
    """文件已经被其他操作修改。"""


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:12]}"


def _check_kind(kind: str) -> str:
    if kind not in DATA_KINDS:
        raise PromptDataError(f"不支持的数据类型：{kind}")
    return kind


def get_legacy_user_data_root() -> Path:
    """返回 alpha.13 及更早版本使用的插件外部数据目录。"""

    configured = os.environ.get("ELZA_PROMPT_HUB_LEGACY_DATA_DIR")
    if configured:
        return Path(configured).expanduser().resolve()

    try:
        import folder_paths  # type: ignore

        get_user_directory = getattr(folder_paths, "get_user_directory", None)
        if callable(get_user_directory):
            return Path(get_user_directory()).resolve() / "elza-prompt-hub"
    except ImportError:
        pass

    appdata = os.environ.get("APPDATA")
    if appdata:
        return Path(appdata).resolve() / "ElzaPromptHub"
    return Path.home().resolve() / ".elza-prompt-hub"


def get_data_dir(kind: str) -> Path:
    """返回插件内的 Bank/Mixer 主数据目录。"""

    checked_kind = _check_kind(kind)
    configured_root = os.environ.get("ELZA_PROMPT_HUB_DATA_DIR")
    plugin_root = (
        Path(configured_root).expanduser().resolve()
        if configured_root
        else PLUGIN_DIR.resolve()
    )
    directory = plugin_root / DATA_RELATIVE_DIRS[checked_kind]
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def reveal_data_folder(kind: str, document_id: str) -> Path:
    """在操作系统文件管理器中打开当前词库所在目录。"""

    path = _document_path(kind, document_id)
    if not path.exists():
        raise PromptDataError("数据文件不存在")
    folder = path.parent
    if os.name == "nt":
        subprocess.Popen(["explorer.exe", str(folder)], close_fds=True)
    elif os.name == "posix":
        subprocess.Popen(["xdg-open", str(folder)], close_fds=True)
    else:
        raise PromptDataError("当前操作系统不支持打开文件管理器")
    return folder


def _document_path(kind: str, document_id: str) -> Path:
    _check_kind(kind)
    normalized_id = str(document_id).strip().lower()
    if not _ID_RE.fullmatch(normalized_id):
        raise PromptDataError("文件 ID 只能包含小写字母、数字、下划线和连字符")
    directory = get_data_dir(kind).resolve()
    path = (directory / f"{normalized_id}.yaml").resolve()
    if path.parent != directory:
        raise PromptDataError("数据路径超出允许范围")
    return path


def _normalize_text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _normalize_id(value: Any, prefix: str) -> str:
    candidate = _normalize_text(value).lower()
    return candidate if _ID_RE.fullmatch(candidate) else new_id(prefix)


def _normalize_bank(document: dict[str, Any]) -> dict[str, Any]:
    categories: list[dict[str, Any]] = []
    for raw_category in document.get("categories", []):
        if not isinstance(raw_category, dict):
            continue
        children: list[dict[str, Any]] = []
        for raw_child in raw_category.get("children", []):
            if not isinstance(raw_child, dict):
                continue
            entries: list[dict[str, Any]] = []
            for raw_entry in raw_child.get("entries", []):
                if not isinstance(raw_entry, dict):
                    continue
                text = _normalize_text(raw_entry.get("text"))
                if not text:
                    continue
                aliases = raw_entry.get("aliases", [])
                entries.append({
                    "name": _normalize_text(raw_entry.get("name")) or text,
                    "text": text,
                    "aliases": [
                        _normalize_text(alias)
                        for alias in aliases
                        if _normalize_text(alias)
                    ] if isinstance(aliases, list) else [],
                })
            children.append({
                "name": _normalize_text(raw_child.get("name")) or "未命名分类",
                "entries": entries,
            })
        categories.append({
            "name": _normalize_text(raw_category.get("name")) or "未命名分类",
            "children": children,
        })

    return {
        "version": 3,
        "kind": "bank",
        "id": _normalize_id(document.get("id"), "bank"),
        "name": _normalize_text(document.get("name")) or "未命名词库",
        "categories": categories,
    }


def _normalize_mix(document: dict[str, Any]) -> dict[str, Any]:
    categories: list[dict[str, Any]] = []
    raw_categories = document.get("categories", [])

    # 兼容 alpha.4 的“分组 + 固定/随机候选”数据，只迁移可读名称和文本，
    # 不再把分组/词条 ID、随机模式或概率写回新版 YAML。
    if not isinstance(raw_categories, list) or not raw_categories:
        legacy_groups = document.get("groups", [])
        if isinstance(legacy_groups, list) and legacy_groups:
            raw_categories = [{
                "name": "默认",
                "children": [
                    {
                        "name": group.get("name", "未命名分类"),
                        "entries": group.get("candidates", []),
                    }
                    for group in legacy_groups
                    if isinstance(group, dict)
                ],
            }]

    if isinstance(raw_categories, list):
        for raw_category in raw_categories:
            if not isinstance(raw_category, dict):
                continue
            children: list[dict[str, Any]] = []
            for raw_child in raw_category.get("children", []):
                if not isinstance(raw_child, dict):
                    continue
                entries: list[dict[str, str]] = []
                for raw_entry in raw_child.get("entries", []):
                    if not isinstance(raw_entry, dict):
                        continue
                    text = _normalize_text(raw_entry.get("text"))
                    if not text:
                        continue
                    entries.append({
                        "name": _normalize_text(raw_entry.get("name")) or text,
                        "text": text,
                    })
                children.append({
                    "name": _normalize_text(raw_child.get("name")) or "未命名分类",
                    "entries": entries,
                })
            categories.append({
                "name": _normalize_text(raw_category.get("name")) or "未命名分类",
                "children": children,
            })

    return {
        "version": 3,
        "kind": "mix",
        "id": _normalize_id(document.get("id"), "mix"),
        "name": _normalize_text(document.get("name")) or "未命名配方",
        "categories": categories,
    }


def normalize_document(kind: str, document: Any) -> dict[str, Any]:
    _check_kind(kind)
    if not isinstance(document, dict):
        raise PromptDataError("数据文件顶层必须是对象")
    normalized = _normalize_bank(document) if kind == "bank" else _normalize_mix(document)
    if document.get("id") and normalized["id"] != str(document.get("id")).lower():
        raise PromptDataError("文件 ID 格式无效")
    return normalized


def _validate_unique_names(document: dict[str, Any]) -> None:
    """无 ID 数据结构依赖名称匹配，因此同级名称必须唯一。"""

    def check(items: list[dict[str, Any]], label: str) -> None:
        seen: set[str] = set()
        for item in items:
            name = _normalize_text(item.get("name"))
            key = name.casefold()
            if key in seen:
                raise PromptDataError(f"{label}中存在重复名称：{name}")
            seen.add(key)

    categories = document.get("categories", [])
    check(categories, "一级 Tag")
    for category in categories:
        children = category.get("children", [])
        check(children, f"一级 Tag“{category['name']}”的二级 Tag")
        for child in children:
            check(
                child.get("entries", []),
                f"二级 Tag“{category['name']} / {child['name']}”的词条",
            )


def _default_document(kind: str) -> dict[str, Any]:
    if kind == "bank":
        return normalize_document("bank", {
            "id": "default-bank",
            "name": "默认词库",
            "categories": [{
                "name": "人物",
                "children": [{
                    "name": "基础",
                    "entries": [
                        {"name": "杰作", "text": "masterpiece"},
                        {"name": "单人女性", "text": "1girl"},
                        {"name": "精致面容", "text": "detailed face"},
                    ],
                }],
            }],
        })
    return normalize_document("mix", {
        "id": "default-mix",
        "name": "默认 Mixer 词库",
        "categories": [
            {
                "name": "人物",
                "children": [
                    {
                        "name": "主体",
                        "entries": [
                            {"name": "单人女性", "text": "1girl"},
                            {"name": "单人男性", "text": "1boy"},
                        ],
                    },
                    {
                        "name": "光照",
                        "entries": [
                            {"name": "柔和摄影棚光", "text": "soft studio lighting"},
                            {"name": "电影轮廓光", "text": "cinematic rim lighting"},
                        ],
                    },
                ],
            },
        ],
    })


def _serialize(document: dict[str, Any]) -> str:
    stored_document = deepcopy(document)
    # 文件名已经是文档定位 key；YAML 只保存用户可读业务数据，不写 ID。
    stored_document.pop("id", None)
    return yaml.safe_dump(
        stored_document,
        allow_unicode=True,
        sort_keys=False,
        default_flow_style=False,
    )


def _legacy_wordbank_document(
    data: Any, document_id: str, document_name: str
) -> dict[str, Any] | None:
    """把插件根目录旧 ``wordbank.yaml`` 转成 v2；不修改旧文件。"""

    if not isinstance(data, dict):
        return None
    categories: list[dict[str, Any]] = []
    for category_name, raw_groups in data.items():
        if not isinstance(raw_groups, dict):
            continue
        children: list[dict[str, Any]] = []
        for group_name, raw_entries in raw_groups.items():
            if not isinstance(raw_entries, list):
                continue
            entries = []
            for raw_entry in raw_entries:
                if isinstance(raw_entry, str):
                    name, separator, text = raw_entry.partition("|")
                    actual_text = text if separator else name
                    entries.append({
                        "id": new_id("entry"),
                        "name": name.strip() or actual_text.strip(),
                        "text": actual_text.strip(),
                    })
                elif isinstance(raw_entry, dict):
                    text = _normalize_text(
                        raw_entry.get("text") or raw_entry.get("en")
                    )
                    if text:
                        entries.append({
                            "id": _normalize_id(raw_entry.get("id"), "entry"),
                            "name": _normalize_text(
                                raw_entry.get("name") or raw_entry.get("zh")
                            ) or text,
                            "text": text,
                        })
            children.append({
                "id": new_id("group"),
                "name": _normalize_text(group_name) or "未命名分类",
                "entries": entries,
            })
        categories.append({
            "id": new_id("category"),
            "name": _normalize_text(category_name) or "未命名分类",
            "children": children,
        })
    if not categories:
        return None
    return normalize_document("bank", {
        "id": document_id,
        "name": document_name,
        "categories": categories,
    })


def _revision_from_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.stem}-", suffix=".tmp", dir=str(path.parent)
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    except Exception:
        try:
            os.unlink(temporary_name)
        except OSError:
            pass
        raise


def _migrate_external_documents(kind: str, directory: Path) -> None:
    """首次使用插件内目录时复制旧用户目录的数据，不删除旧文件。"""

    marker = directory / ".external-user-data-migrated-v1"
    if marker.exists():
        return

    source_directory = get_legacy_user_data_root() / kind
    try:
        same_directory = source_directory.resolve() == directory.resolve()
    except OSError:
        same_directory = False

    migration_failed = False
    if source_directory.is_dir() and not same_directory:
        for source in sorted(source_directory.glob("*.yaml")):
            try:
                loaded = yaml.safe_load(source.read_text(encoding="utf-8"))
                if not isinstance(loaded, dict):
                    continue
                preferred_id = re.sub(
                    r"[^a-z0-9_-]+", "-", source.stem.lower()
                ).strip("-_")[:64]
                loaded = dict(loaded)
                loaded["id"] = (
                    preferred_id
                    if preferred_id and _ID_RE.fullmatch(preferred_id)
                    else new_id(kind)
                )
                document = normalize_document(kind, loaded)
                serialized = _serialize(document)
                target = _document_path(kind, document["id"])
                if target.exists():
                    if target.read_text(encoding="utf-8") == serialized:
                        continue
                    duplicate_exists = any(
                        candidate.read_text(encoding="utf-8") == serialized
                        for candidate in directory.glob("*.yaml")
                    )
                    if duplicate_exists:
                        continue
                    document["id"] = _available_document_id(
                        kind, f"{document['id']}-migrated"
                    )
                    document["name"] = (
                        f"{document['name']}（从旧用户目录迁移）"
                    )
                    serialized = _serialize(document)
                    target = _document_path(kind, document["id"])
                _atomic_write(target, serialized)
            except (
                OSError,
                UnicodeDecodeError,
                yaml.YAMLError,
                PromptDataError,
            ):
                migration_failed = True

    if not migration_failed:
        _atomic_write(marker, "external-user-data-migrated-v1\n")


def ensure_default_document(kind: str) -> None:
    directory = get_data_dir(kind)
    _migrate_external_documents(kind, directory)
    if any(directory.glob("*.yaml")):
        return
    if kind == "bank":
        migrated_count = 0
        legacy_paths = [
            path
            for path in sorted(PLUGIN_DIR.glob("wordbank*.yaml"))
            if path.name.lower() != "wordbank-example.yaml"
        ]
        for legacy_path in legacy_paths:
            try:
                legacy_data = yaml.safe_load(legacy_path.read_text(encoding="utf-8"))
                digest = hashlib.sha256(
                    legacy_path.name.lower().encode("utf-8")
                ).hexdigest()[:10]
                migrated = _legacy_wordbank_document(
                    legacy_data,
                    f"legacy-{digest}",
                    f"{legacy_path.stem}（已迁移）",
                )
                if migrated:
                    _atomic_write(
                        _document_path(kind, migrated["id"]),
                        _serialize(migrated),
                    )
                    migrated_count += 1
            except (OSError, UnicodeDecodeError, yaml.YAMLError, PromptDataError):
                continue
        if migrated_count:
            return
    document = _default_document(kind)
    _atomic_write(_document_path(kind, document["id"]), _serialize(document))


def list_documents(kind: str) -> list[dict[str, Any]]:
    ensure_default_document(kind)
    result: list[dict[str, Any]] = []
    for path in sorted(get_data_dir(kind).glob("*.yaml")):
        try:
            loaded = yaml.safe_load(path.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                loaded = dict(loaded)
                loaded["id"] = path.stem
            document = normalize_document(kind, loaded)
            result.append({
                "id": document["id"],
                "name": document["name"],
                "revision": _revision_from_bytes(path.read_bytes()),
            })
        except (OSError, yaml.YAMLError, PromptDataError):
            continue
    return result


def load_document(kind: str, document_id: str) -> tuple[dict[str, Any], str]:
    path = _document_path(kind, document_id)
    if not path.exists():
        raise PromptDataError("数据文件不存在")
    content = path.read_bytes()
    try:
        loaded = yaml.safe_load(content.decode("utf-8"))
    except (UnicodeDecodeError, yaml.YAMLError) as error:
        raise PromptDataError(f"数据文件无法解析：{error}") from error
    if isinstance(loaded, dict):
        loaded = dict(loaded)
        loaded["id"] = path.stem
    return normalize_document(kind, loaded), _revision_from_bytes(content)


def save_document(
    kind: str,
    document: Any,
    expected_revision: str | None = None,
) -> tuple[dict[str, Any], str]:
    normalized = normalize_document(kind, deepcopy(document))
    _validate_unique_names(normalized)
    path = _document_path(kind, normalized["id"])
    if path.exists() and expected_revision:
        current_revision = _revision_from_bytes(path.read_bytes())
        if current_revision != expected_revision:
            raise PromptDataConflict("文件已被外部修改，请重新载入后再保存")
    serialized = _serialize(normalized)
    _atomic_write(path, serialized)
    return normalized, _revision_from_bytes(serialized.encode("utf-8"))


def delete_document(kind: str, document_id: str) -> None:
    """删除一个用户明确选中的词库文件。"""

    path = _document_path(kind, document_id)
    if not path.exists():
        raise PromptDataError("数据文件不存在")
    path.unlink()


def _available_document_id(kind: str, preferred_id: str) -> str:
    base = re.sub(r"[^a-z0-9_-]+", "-", preferred_id.lower()).strip("-_")
    if not base or not _ID_RE.fullmatch(base[:64]):
        base = new_id(kind)
    base = base[:64]
    candidate = base
    suffix = 2
    while _document_path(kind, candidate).exists():
        marker = f"-{suffix}"
        candidate = f"{base[:64 - len(marker)]}{marker}"
        suffix += 1
    return candidate


def import_document(
    kind: str, content: str | bytes, filename: str = ""
) -> tuple[dict[str, Any], str]:
    """导入单个 YAML；同名文件自动生成新文件名，不覆盖现有数据。"""

    _check_kind(kind)
    raw_bytes = content.encode("utf-8") if isinstance(content, str) else bytes(content)
    try:
        loaded = yaml.safe_load(raw_bytes.decode("utf-8-sig"))
    except (UnicodeDecodeError, yaml.YAMLError) as error:
        raise PromptDataError(f"导入文件无法解析：{error}") from error
    if not isinstance(loaded, dict):
        raise PromptDataError("导入文件顶层必须是对象")
    preferred = Path(filename).stem if filename else str(loaded.get("id") or kind)
    loaded = dict(loaded)
    loaded["id"] = _available_document_id(kind, preferred)
    normalized = normalize_document(kind, loaded)
    return save_document(kind, normalized)


def export_document(kind: str, document_id: str) -> tuple[bytes, str]:
    """返回单个 YAML 的原始字节，交由浏览器系统保存窗口写入。"""

    path = _document_path(kind, document_id)
    if not path.exists():
        raise PromptDataError("数据文件不存在")
    return path.read_bytes(), path.name


def export_documents_archive(kind: str) -> tuple[bytes, str]:
    """将一类词库打包到内存，不在插件目录创建备份文件。"""

    _check_kind(kind)
    ensure_default_document(kind)
    created_at = datetime.now()
    sources = sorted(get_data_dir(kind).glob("*.yaml"))
    manifest = {
        "version": 1,
        "kind": kind,
        "created_at": created_at.isoformat(timespec="seconds"),
        "files": [source.name for source in sources],
    }
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for source in sources:
            archive.writestr(source.name, source.read_bytes())
        archive.writestr(
            "manifest.json",
            json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8"),
        )
    filename = f"elza-prompt-{kind}-backup-{created_at:%Y%m%d-%H%M%S}.zip"
    return buffer.getvalue(), filename


def read_node_properties(
    unique_id: Any, extra_pnginfo: Any
) -> dict[str, Any]:
    """兼容字符串/列表 unique_id 和 dict/list extra_pnginfo。"""

    if isinstance(unique_id, (list, tuple)) and unique_id:
        unique_id = unique_id[0]
    if unique_id is None:
        return {}

    workflow: Any = None
    if isinstance(extra_pnginfo, dict):
        workflow = extra_pnginfo.get("workflow")
    elif isinstance(extra_pnginfo, (list, tuple)) and extra_pnginfo:
        first = extra_pnginfo[0]
        if isinstance(first, dict):
            workflow = first.get("workflow")
    if not isinstance(workflow, dict):
        return {}

    for node in workflow.get("nodes", []):
        if str(node.get("id")) == str(unique_id):
            properties = node.get("properties", {})
            return properties if isinstance(properties, dict) else {}
    return {}


def read_json_property(properties: dict[str, Any], key: str) -> dict[str, Any]:
    value = properties.get(key, {})
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def join_prompt_parts(parts: list[Any]) -> str:
    return ", ".join(
        str(part).strip()
        for part in parts
        if part is not None and str(part).strip()
    )
