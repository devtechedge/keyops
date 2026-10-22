#!/usr/bin/env python3
"""Report project skill usage and stale candidates. Read-only."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
USAGE = ROOT / ".usage.json"
ARCHIVE = ROOT / ".archive"


def load_usage() -> dict:
    if not USAGE.exists():
        return {}
    try:
        return json.loads(USAGE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def read_name(skill_dir: Path) -> str:
    skill = skill_dir / "SKILL.md"
    if not skill.exists():
        return skill_dir.name
    for line in skill.read_text(encoding="utf-8").splitlines():
        if line.startswith("name:"):
            return line.split(":", 1)[1].strip()
    return skill_dir.name


def days_since(value: str | None) -> int | None:
    if not value:
        return None
    try:
        stamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - stamp).days


def main() -> None:
    usage = load_usage()
    rows = []
    for skill_dir in sorted(ROOT.iterdir()):
        if not skill_dir.is_dir() or skill_dir.name.startswith("."):
            continue
        name = read_name(skill_dir)
        meta = usage.get(name, {})
        age = days_since(meta.get("last_used"))
        stale = bool(age is not None and age >= 30 and meta.get("created_by") == "learn")
        rows.append((name, meta.get("state", "unregistered"), meta.get("created_by", "?"), age, stale))

    print("name                         state          created_by   last_used")
    for name, state, created_by, age, _ in rows:
        age_text = "never" if age is None else f"{age}d ago"
        print(f"{name:28} {state:14} {created_by:12} {age_text}")

    stale_rows = [row for row in rows if row[4]]
    print(f"\n{len(rows)} skills, {len(stale_rows)} stale learn-created candidates")
    for name, _, _, age, _ in stale_rows:
        print(f"  {name} ({age}d)")
    print(f"archive: {ARCHIVE}")


if __name__ == "__main__":
    main()
