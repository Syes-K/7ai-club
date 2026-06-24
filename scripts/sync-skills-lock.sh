#!/usr/bin/env bash
# Regenerate skills-lock.json from installed .agents/skills/ (matches skills CLI hash algorithm).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 << 'PY'
import hashlib
import json
from pathlib import Path

AGENTS = Path(".agents/skills")

SOURCES = {
    "brainstorming": ("git@github.com:obra/superpowers.git", "skills/brainstorming/SKILL.md"),
    "dispatching-parallel-agents": ("git@github.com:obra/superpowers.git", "skills/dispatching-parallel-agents/SKILL.md"),
    "executing-plans": ("git@github.com:obra/superpowers.git", "skills/executing-plans/SKILL.md"),
    "finishing-a-development-branch": ("git@github.com:obra/superpowers.git", "skills/finishing-a-development-branch/SKILL.md"),
    "receiving-code-review": ("git@github.com:obra/superpowers.git", "skills/receiving-code-review/SKILL.md"),
    "requesting-code-review": ("git@github.com:obra/superpowers.git", "skills/requesting-code-review/SKILL.md"),
    "subagent-driven-development": ("git@github.com:obra/superpowers.git", "skills/subagent-driven-development/SKILL.md"),
    "systematic-debugging": ("git@github.com:obra/superpowers.git", "skills/systematic-debugging/SKILL.md"),
    "test-driven-development": ("git@github.com:obra/superpowers.git", "skills/test-driven-development/SKILL.md"),
    "using-git-worktrees": ("git@github.com:obra/superpowers.git", "skills/using-git-worktrees/SKILL.md"),
    "writing-plans": ("git@github.com:obra/superpowers.git", "skills/writing-plans/SKILL.md"),
    "supabase": ("git@github.com:supabase/agent-skills.git", "skills/supabase/SKILL.md"),
    "supabase-postgres-best-practices": ("git@github.com:supabase/agent-skills.git", "skills/supabase-postgres-best-practices/SKILL.md"),
    "vercel-react-best-practices": ("git@github.com:vercel-labs/agent-skills.git", "skills/react-best-practices/SKILL.md"),
    "ui-ux-pro-max": ("git@github.com:nextlevelbuilder/ui-ux-pro-max-skill.git", "skills/ui-ux-pro-max/SKILL.md"),
}


def compute_skill_folder_hash(skill_dir: Path) -> str:
    files = []
    for p in skill_dir.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(skill_dir).as_posix()
        if rel.split("/")[0] in (".git", "node_modules"):
            continue
        files.append((rel, p.read_bytes()))
    files.sort(key=lambda x: x[0])
    h = hashlib.sha256()
    for rel, content in files:
        h.update(rel.encode())
        h.update(content)
    return h.hexdigest()


skills = {}
missing = []
for name in sorted(SOURCES):
    skill_dir = AGENTS / name
    if not skill_dir.is_dir():
        missing.append(name)
        continue
    source, skill_path = SOURCES[name]
    skills[name] = {
        "source": source,
        "sourceType": "git",
        "skillPath": skill_path,
        "computedHash": compute_skill_folder_hash(skill_dir),
    }

if missing:
    raise SystemExit(f"Missing .agents/skills/: {', '.join(missing)}")

lock = {"version": 1, "skills": skills}
Path("skills-lock.json").write_text(json.dumps(lock, indent=2) + "\n")
print(f"Updated skills-lock.json ({len(skills)} skills)")
PY
