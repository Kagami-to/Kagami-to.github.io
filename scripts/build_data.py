"""Shared data helpers for the production site build."""

from pathlib import Path
import csv

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'


def rows(name):
    """Load a CSV from the canonical data directory."""
    with (DATA / name).open('r', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def url_id(value):
    """Normalize a stored URL identifier exactly as the site builder does."""
    value = (value or '').strip()
    return value.lower().replace('.', '-') if value else ''
