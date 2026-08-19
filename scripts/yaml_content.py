from pathlib import Path
import json
import re
from typing import Any

import yaml


DEFAULT_DISPLAY = "normal"
DEFAULT_TOGGLE = {
    "ja": {"open": "内容を表示", "close": "内容を隠す"},
    "en": {"open": "Show content", "close": "Hide content"},
}
ENTITY_ID_RE = re.compile(r"^[PCMT]\d+$")


def _text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return str(value)


def _content_item(value: Any) -> Any:
    if isinstance(value, str):
        text = value.strip()
        if ENTITY_ID_RE.fullmatch(text):
            return {"type": "entity", "id": text}
        return {"type": "text", "text": value}
    if isinstance(value, dict):
        return {
            "type": "text",
            "align": "right" if value.get("align") == "right" else "left",
            "text": _text(value.get("text")),
        }
    return None


def _content(value: Any) -> Any:
    if isinstance(value, str):
        text = value.strip()
        if ENTITY_ID_RE.fullmatch(text):
            return [{"type": "entity", "id": text}]
        return value
    if isinstance(value, list):
        return [normalized for item in value if (normalized := _content_item(item)) is not None]
    return _text(value)


def normalize_document(raw: Any, source_id: str = "") -> dict:
    if not isinstance(raw, dict):
        raw = {}

    result = dict(raw)
    result["id"] = _text(raw.get("id") or source_id)

    raw_sections = raw.get("sections")
    if not isinstance(raw_sections, list):
        raw_sections = []

    sections = []
    for raw_section in raw_sections:
        if not isinstance(raw_section, dict):
            continue
        section = dict(raw_section)
        section["title_ja"] = _text(raw_section.get("title_ja"))
        section["title_en"] = _text(raw_section.get("title_en"))

        display = raw_section.get("display", DEFAULT_DISPLAY)
        section["display"] = display if display in {"normal", "collapsible"} else DEFAULT_DISPLAY

        raw_works = raw_section.get("related_works", raw_section.get("works", []))
        works = raw_works if isinstance(raw_works, list) else []
        work_ids = [_text(value) for value in works if _text(value)]

        raw_common = raw_section.get("content")
        raw_content_ja = raw_section.get("content_ja")
        raw_content_en = raw_section.get("content_en")
        has_any_content = any(value is not None for value in (raw_common, raw_content_ja, raw_content_en))

        normalized_common = _content(raw_common)
        normalized_ja = _content(raw_content_ja)
        normalized_en = _content(raw_content_en)

        # Legacy `works:`-only sections become common language-independent content.
        # This is a compatibility transformation and never copies one language into another.
        if work_ids and not has_any_content:
            legacy_entities = [{"type": "entity", "id": work_id} for work_id in work_ids]
            normalized_common = legacy_entities

        section["content"] = normalized_common

        for lang, normalized in (("ja", normalized_ja), ("en", normalized_en)):
            raw_toggle = raw_section.get(f"toggle_{lang}")
            if not isinstance(raw_toggle, dict):
                raw_toggle = {}
            section[f"toggle_{lang}"] = {
                "open": _text(raw_toggle.get("open") or DEFAULT_TOGGLE[lang]["open"]),
                "close": _text(raw_toggle.get("close") or DEFAULT_TOGGLE[lang]["close"]),
            }
            section[f"content_{lang}"] = normalized

        section["related_works"] = work_ids
        sections.append(section)

    result["sections"] = sections
    return result


def load_yaml_document(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}
    return normalize_document(raw, path.stem)


def write_normalized_json(source: Path, destination: Path) -> None:
    parsed = load_yaml_document(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8") as handle:
        json.dump(parsed, handle, ensure_ascii=False, indent=2)


def export_yaml_directory(source_dir: Path, destination_dir: Path) -> None:
    if not source_dir.exists():
        return
    destination_dir.mkdir(parents=True, exist_ok=True)
    for yaml_path in source_dir.glob("*.yaml"):
        destination = destination_dir / yaml_path.name
        destination.write_text(yaml_path.read_text(encoding="utf-8"), encoding="utf-8")
        write_normalized_json(yaml_path, destination_dir / f"{yaml_path.stem}.json")
