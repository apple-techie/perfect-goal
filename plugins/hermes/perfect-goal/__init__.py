"""perfect_goal — hermes plugin exposing the Perfect Goal framework as a tool.

When a hermes agent calls perfect_goal(topic="...", type="...", scope="..."),
this plugin returns the full Perfect Goal framework (methodology + template +
rubric + per-type adaptive matrix) with the caller's topic injected as Phase 1
context. The agent then continues with the framework loaded, producing the
13-section goal output in its next turn.

The plugin is intentionally THIN. It does not call an LLM directly; it relies
on the calling agent's own LLM context to do the synthesis work. This keeps
the plugin runtime-cheap and provider-agnostic — works identically whether
the agent is backed by anthropic/grok/litellm/local.

Upstream framework: https://github.com/apple-techie/perfect-goal

Architecture note: the framework files (TEMPLATE.md / METHODOLOGY.md /
RUBRIC.md / GOAL-TYPES.md) are bundled inside the plugin dir as a sibling
'framework/' subdir at install time. Install the plugin via the perfect-goal
repo's install.sh which fetches the latest framework version. Updates are
in-place — bump the plugin version when bundling a newer framework version.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

PLUGIN_DIR = Path(__file__).resolve().parent
FRAMEWORK_DIR = PLUGIN_DIR / "framework"

VALID_TYPES = {
    "bug",
    "feature",
    "migration",
    "infra",
    "research",
    "refactor",
    "unification",
    "auto",
}
VALID_SCOPES = {"wide", "tight"}
VALID_TIERS = {"A", "AB", "ABC"}


def _read_framework_file(name: str) -> str:
    """Read a bundled framework file, returning '' if missing.

    Framework files are expected at <plugin_dir>/framework/<name>. The
    perfect-goal install.sh symlinks them in from the parent repo at install
    time. If a file is missing we degrade gracefully — the plugin still works,
    just without that file's guidance loaded.
    """
    path = FRAMEWORK_DIR / name
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.warning("perfect_goal: framework file %s not found at %s", name, path)
        return ""
    except OSError as err:
        logger.warning("perfect_goal: framework file %s unreadable: %s", name, err)
        return ""


def _build_response(
    topic: str,
    goal_type: str,
    scope: str,
    tier: str,
    window: int,
    repos: list[str] | None,
) -> dict[str, Any]:
    """Assemble the framework payload returned to the calling agent.

    The response is a JSON dict the agent reads as tool output. Sections:
      - 'topic'       : the caller's topic, normalized
      - 'flags'       : type / scope / tier / window / repos
      - 'workflow'    : the 3-phase methodology
      - 'template'    : the 13-section output template
      - 'rubric'      : the 44-point quality rubric
      - 'goal_types'  : per-type adaptive section matrix
      - 'instructions': what to do next (Phase 1 first; do not skip)
    """
    framework = {
        "methodology": _read_framework_file("METHODOLOGY.md"),
        "template": _read_framework_file("TEMPLATE.md"),
        "rubric": _read_framework_file("RUBRIC.md"),
        "goal_types": _read_framework_file("GOAL-TYPES.md"),
    }

    instructions = (
        "You are running the Perfect Goal framework. Topic: "
        f"{topic!r}.\n\n"
        "Phase 1 — Evidence-anchored synthesis: pull recent commits across "
        "involved repos, cluster into 3-6 themes, state the originating "
        "outcome in ONE sentence with receipts inline. Wait for "
        "confirmation before Phase 2.\n\n"
        "Phase 2 — Gap + state inventory: classify each theme as "
        "shipped/halfway/open; decompose every open gap with all 7 "
        "ingredients (signal, hypothesis tree, probes, fix paths, "
        "rollback, reproduces-also-on, success metric).\n\n"
        "Phase 3 — 100x compression: fill the 13-section template; "
        "validate against the 44-point rubric (refuse to deliver if 3+ "
        "checks fail); close with three real-branch scoping questions.\n\n"
        "The full methodology, template, rubric, and goal-type matrix are "
        "in the 'framework' fields below. Read them before starting Phase 1."
    )

    return {
        "topic": topic,
        "flags": {
            "type": goal_type,
            "scope": scope,
            "tier": tier,
            "window": window,
            "repos": repos or [],
        },
        "instructions": instructions,
        "framework": framework,
        "version": "0.1.0",
        "upstream": "https://github.com/apple-techie/perfect-goal",
    }


def perfect_goal_handler(args: dict[str, Any]) -> str:
    """Tool handler — returns the framework payload as a JSON string.

    Hermes tool handlers return str; we encode the dict to JSON so the
    agent receives structured fields it can parse + reason about.
    """
    topic = (args.get("topic") or "").strip()
    if not topic:
        return json.dumps(
            {"error": "topic is required (non-empty string)"},
            indent=2,
        )

    goal_type = (args.get("type") or "auto").strip()
    if goal_type not in VALID_TYPES:
        return json.dumps(
            {"error": f"type must be one of {sorted(VALID_TYPES)}, got {goal_type!r}"},
            indent=2,
        )

    scope = (args.get("scope") or "tight").strip()
    if scope not in VALID_SCOPES:
        return json.dumps(
            {"error": f"scope must be one of {sorted(VALID_SCOPES)}, got {scope!r}"},
            indent=2,
        )

    tier = (args.get("tier") or "AB").strip()
    if tier not in VALID_TIERS:
        return json.dumps(
            {"error": f"tier must be one of {sorted(VALID_TIERS)}, got {tier!r}"},
            indent=2,
        )

    window = args.get("window") or 40
    if not isinstance(window, int) or window < 1 or window > 500:
        return json.dumps(
            {"error": f"window must be an int in [1, 500], got {window!r}"},
            indent=2,
        )

    repos = args.get("repos")
    if repos is not None and not (
        isinstance(repos, list) and all(isinstance(r, str) for r in repos)
    ):
        return json.dumps(
            {"error": "repos must be a list of strings if provided"},
            indent=2,
        )

    response = _build_response(topic, goal_type, scope, tier, window, repos)
    return json.dumps(response, indent=2)


_TOOL_SCHEMA = {
    "type": "object",
    "properties": {
        "topic": {
            "type": "string",
            "description": (
                "One-line description of the goal to build a prompt for, OR "
                "the literal string 'from recent history' to derive from "
                "recent commits in the listed repos."
            ),
        },
        "type": {
            "type": "string",
            "enum": sorted(VALID_TYPES),
            "description": (
                "Goal type — drives which template sections are required vs "
                "skippable. 'auto' (default) infers from topic keywords."
            ),
        },
        "scope": {
            "type": "string",
            "enum": sorted(VALID_SCOPES),
            "description": (
                "tight = single thread; wide = include related side-quests. "
                "Default tight."
            ),
        },
        "tier": {
            "type": "string",
            "enum": sorted(VALID_TIERS),
            "description": (
                "A = quickest ship only; AB = ship + next phase planned; "
                "ABC = long-term roadmap included. Default AB."
            ),
        },
        "window": {
            "type": "integer",
            "minimum": 1,
            "maximum": 500,
            "description": "Commits per repo to review in Phase 1. Default 40.",
        },
        "repos": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Repo paths to pull history from. Auto-detect if omitted.",
        },
    },
    "required": ["topic"],
}


def register(ctx: Any) -> None:
    """Plugin entry — gateway calls this on load.

    Registers a single tool 'perfect_goal' in toolset 'perfect_goal' that
    returns the framework payload. The calling agent reads the payload and
    continues the workflow in its own LLM context.
    """
    ctx.register_tool(
        name="perfect_goal",
        toolset="perfect_goal",
        schema=_TOOL_SCHEMA,
        handler=perfect_goal_handler,
        emoji="🎯",
    )
    framework_present = FRAMEWORK_DIR.is_dir() and any(FRAMEWORK_DIR.iterdir())
    logger.info(
        "perfect_goal plugin: registered (framework_bundled=%s, dir=%s)",
        framework_present,
        FRAMEWORK_DIR,
    )
