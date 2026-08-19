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
        items = []
        for item in value:
            normalized = _content_item(item)
            if normalized is not None:
                items.append(normalized)
        return items
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

        for lang in ("ja", "en"):
            raw_toggle = raw_section.get(f"toggle_{lang}")
            if not isinstance(raw_toggle, dict):
                raw_toggle = {}
            section[f"toggle_{lang}"] = {
                "open": _text(raw_toggle.get("open") or DEFAULT_TOGGLE[lang]["open"]),
                "close": _text(raw_toggle.get("close") or DEFAULT_TOGGLE[lang]["close"]),
            }
            section[f"content_{lang}"] = _content(raw_section.get(f"content_{lang}"))

        works = raw_section.get("related_works", raw_section.get("works", []))
        if not isinstance(works, list):
            works = []
        section["related_works"] = [_text(value) for value in works if _text(value)]
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
