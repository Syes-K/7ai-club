#!/usr/bin/env bash
# Patch Superpowers skills: disable auto-invocation so only subagents may Read them.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 << 'PY'
import json
from pathlib import Path

lock_path = Path("skills-lock.json")
if not lock_path.exists():
    print("skills-lock.json not found, skipping patch")
    raise SystemExit(0)

lock = json.loads(lock_path.read_text())
superpowers = [
    name
    for name, meta in lock["skills"].items()
    if "obra/superpowers" in meta.get("source", "")
]

patched = 0
skipped = 0
missing = 0

for name in superpowers:
    skill_md = Path(f".agents/skills/{name}/SKILL.md")
    if not skill_md.exists():
        print(f"  skip (missing): {name}")
        missing += 1
        continue

    text = skill_md.read_text()
    if "disable-model-invocation:" in text:
        skipped += 1
        continue

    if not text.startswith("---"):
        print(f"  skip (no frontmatter): {name}")
        skipped += 1
        continue

    end = text.find("---", 3)
    if end == -1:
        print(f"  skip (malformed frontmatter): {name}")
        skipped += 1
        continue

    front = text[3:end].rstrip()
    new_text = f"---\n{front}\ndisable-model-invocation: true\n---{text[end + 3:]}"
    skill_md.write_text(new_text)
    print(f"  patched: {name}")
    patched += 1

print(f"Done: {patched} patched, {skipped} already set, {missing} missing")
PY
