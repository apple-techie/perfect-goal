---
name: hermes
description: Working knowledge of the Hermes agent platform (NousResearch hermes-agent fork at enduru). Use when editing or debugging hermes-agent code, authoring hermes plugins (plugin.yaml + __init__.py), navigating the v15/v16 upstream-merge regression history, or planning operator/customer fleet rollouts. Auto-invokes on mentions of "hermes", "mc_worker", "valiant-crown", "agent_manifest", "spawn_subprocess_agent", "hermes-fleet", "enduru-mc-v*", "customer pin bump", or work in directories matching hermes-agent-enduru or enduru-agent-infra.
---

# Hermes — Working Knowledge

Hermes is a Python-based AI agent platform forked from NousResearch/hermes-agent and operated as `enduru-mc-v<NN>` releases. This skill compresses the high-leverage knowledge for working in and deploying hermes — codebase layout, plugin authoring, the v15→v16 upstream-merge regression chain, the fleet deploy flow, and the traps that cost real engineering time when missed.

If you're filing a multi-step goal involving hermes, invoke `/perfect-goal` after reading this skill. The two compose: this skill gives you the *facts*, perfect-goal gives you the *output shape*.

---

## Codebase layout

The canonical repo is `hermes-agent-enduru` (fork of NousResearch/hermes-agent). Customer pins live in `enduru-agent-infra/Dockerfile.v2`. Operator fleet builds from `/srv/hermes-fleet-repo` on dokploy-root.

```
hermes-agent-enduru/
├── hermes_cli/                # CLI entry (`python -m hermes_cli.main`)
│   ├── main.py
│   └── plugins.py             # CLI-side plugin route system (see 37268d0bfd)
├── gateway/                   # Long-running gateway (WS RPC + REST)
│   ├── run.py                 # GatewayRunner — includes spawn_subprocess_agent (restored v16.3 / d2072fb484)
│   ├── api_server.py          # FastAPI routes; voice-realtime WS endpoint here
│   ├── mc_worker.py           # Pulls + executes MC tasks; the operator/customer task surface
│   ├── mc_routes.py           # MC-facing REST routes (transcript reader at L~120 reads JSON in v16.1+, was SQLite in upstream)
│   └── voice_realtime/        # Browser/Discord/Meet realtime voice (browser_bridge.py + amalia_session.py)
├── plugins/                   # First-class plugins
│   ├── <name>/
│   │   ├── plugin.yaml        # Declaration — name, version, kind, platforms, provides_tools
│   │   └── __init__.py        # Implementation — register(ctx) entry point
│   └── agent_manifest/        # Posts profile manifest → MC every 60s (see L~47 _profile_agent_id)
├── plugins-dist/              # Built/bundled MC plugin artifacts
├── scripts/                   # Build + release scripts
└── pyproject.toml             # MUST include plugins/**/plugin.yaml in package-data (28be8f2527 v16.1 fix)
```

## Key concepts

- **Profile** — a hermes persona (`valiant-crown`, `valiant-steerer`, `hermes-fast`, `hermes-default`, etc). Each has a SOUL.md + tool palette. Layered per `[[reference_hermes_soul_layering]]`: per-profile SOUL is authoritative for posture; base SOUL carries shared contracts.
- **Gateway** — the long-running process (`gateway/run.py`'s `GatewayRunner`). Hosts WS RPC, REST API, plugin lifecycle, and the mc_worker pull loop.
- **mc_worker** — pulls tasks from MC, claims, executes (via `spawn_subprocess_agent`), reports verdict. Lives in `gateway/mc_worker.py`. **Must be attached to api_server adapter at boot or it silently skips** (the v16.2 regression at `52836b178a`).
- **spawn_subprocess_agent** — the GatewayRunner method that fork-execs a fresh `python -m hermes_cli.main --profile <p> -z <prompt>` per task. Dropped during v16 upstream merge; restored v16.3 (`d2072fb484`). Voice delegation also uses this.
- **agent_manifest plugin** — posts profile manifest (toolsets, skills, capabilities, soulExcerpt, mem0UserId, litellmVirtualKey, fleetCronJobs) to MC `/api/v1/agents/manifests` every 60s. Walks `HERMES_MC_WORKER_PROFILES` for multi-profile containers (rc16 fix `e3fcbf0`).
- **valiant-* profiles** — passive personas (steerer, watcher) that run as mc_worker subprocesses inside the valiant-crown container. See [[reference_valiant_steerer_pattern]].
- **manifest registry** — what each profile's plugin posts; MC fallback path when probe fails. See [[reference_hermes_manifest_registry]] + [[reference_hermes_fleet_update_flow]].

## Plugin authoring

### File layout

```
hermes-agent-enduru/plugins/<your_plugin>/
├── plugin.yaml          # Declaration
└── __init__.py          # Implementation
```

### `plugin.yaml`

```yaml
name: your_plugin
version: 1.0.0
description: |
  One-liner that explains what this plugin does + why.
author: Your Name
kind: standalone        # or 'tool' / 'background' depending on type
platforms:
  - linux
  - darwin
provides_tools:         # Empty if your plugin doesn't expose tools
  - your_tool_name
```

### `__init__.py` — minimal example

```python
"""One-line module docstring. Cross-ref to architecture doc if applicable."""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def your_tool_handler(args: dict[str, Any]) -> str:
    """The tool implementation. Args come in as a dict, return a string."""
    return f"got args: {args}"


def register(ctx: Any) -> None:
    """Plugin entry point — called by gateway on load.

    `ctx` is the plugin context. Use ctx.register_tool() to expose tools
    to the agent loop. Other ctx hooks: register_background_task,
    register_route, register_lifecycle_hook.
    """
    ctx.register_tool(
        name="your_tool_name",
        toolset="your_plugin",
        schema={
            "type": "object",
            "properties": {
                "arg1": {"type": "string", "description": "First arg"},
            },
            "required": ["arg1"],
        },
        handler=your_tool_handler,
        emoji="🔧",
    )
    logger.info("your_plugin: registered tool")
```

### Pitfalls

- **Don't import `gateway/` from a plugin** — plugins must be loadable without a running gateway (e.g. CLI tools call them). Use ctx-passed objects.
- **Background tasks must survive plugin reloads.** mc-manifest's plugin reload bug (the vm-1 gap) is the canonical example — heartbeat tasks registered with `threading.Timer` die on plugin re-instantiation.
- **Add `plugins/**/plugin.yaml` to `pyproject.toml` package-data** — the v16.1 fix (`28be8f2527`). Otherwise the wheel build silently drops them and your plugin "exists but doesn't load."

## The v15 → v16 upstream-merge regression chain

This is the institutional knowledge that prevents re-burning the same week. The 2026-05-20 upstream catch-up merge (4,967 commits → `enduru-mc-v16`) silently dropped 4 fork customizations:

| # | Drop | Symptom | Fix |
|---|---|---|---|
| 1 | `pyproject.toml` package-data missing `plugin.yaml` | Bundled plugins (agent_manifest!) didn't load on customer wheel builds → manifest posting froze | v16.1 (`28be8f2527`) |
| 2 | `mc_routes.py` transcript reader read SQLite not JSON | Session transcripts came back empty | v16.1 (`0f9630cfc1`) |
| 3 | `gateway_runner` not attached to API_SERVER adapter | mc_worker skipped at boot — **no task claiming fleet-wide** | v16.2 (`52836b178a`) |
| 4 | `spawn_subprocess_agent` method dropped from `gateway/run.py` | mc_worker claims but **can't execute** → tasks stall `in-progress/running` | v16.3 (`d2072fb484`) |

**Currently canonical:** `enduru-mc-v16.3`. If you see ANY container running v16.0/v16.1/v16.2, it has at least one regression unfixed.

**The detection signal for #4:** `[mc-worker] spawn_subprocess_agent unavailable` warning in gateway.log. If you see it, the container is not on v16.3.

## Deploy flow

### Operator fleet (4 personas — hermes-default, hermes-fast, hermes-watcher, hermes-deep)

```bash
# On dokploy-root
bash /srv/hermes-fleet-repo/scripts/update-internal-fleet.sh enduru-mc-v16.3
# Rebuilds --no-cache + recreates the 4 personas
```

The operator fleet is built from `/srv/hermes-fleet-repo` (NOT `/srv/hermes` which is stale per `[[reference_hermes_upstream_merge_v16]]`).

### Customer fleet (8 customers — enduru-*)

```bash
# Bump pin in enduru-agent-infra
# Edit Dockerfile.v2: ARG HERMES_PIN_SHA=<new-sha>  AND  the @enduru-mc-v<N> tag string
git -C enduru-agent-infra add Dockerfile.v2
git -C enduru-agent-infra commit -m "fix(customer): bump hermes pin to enduru-mc-v<N>"
git -C enduru-agent-infra push gitlab main    # gitlab, NOT github — Dokploy reads gitlab

# Dokploy auto-deploys via webhook. If a customer's compose dir didn't auto-pull
# (e.g. OAuth token expired), force-redeploy:
# Patch env via dokploy postgres, then:
ssh dokploy-root 'curl -X POST -H "Authorization: Bearer $DOKPLOY_API_KEY" \
  https://localhost:3000/api/compose.deploy -d "{\"composeId\":\"<id>\"}"'
```

Critical traps:

- **Always rebase + push to gitlab.** github push doesn't reach the deploy pipeline (`[[reference_repo_canonical_remotes]]`).
- **Dokploy reads `env` from postgres, which always wins over compose `:-` defaults** (`[[reference_mc_nextpublic_flag_flip]]`). Update DB first.
- **OAuth token expiry kills auto-deploys silently.** Refresh `Andrew922` via Dokploy UI; the token id is `InLtqXztFMPWu67DVUt9N` per `[[reference_dokploy_gitlab_providers]]`.
- **`compose.deploy` doesn't auto-git-pull customer compose dirs** — SSH + `git pull` before API redeploy when pushing source changes (`[[reference_dokploy_deploy_caveats]]`).
- **Bump BOTH the tag string AND `HERMES_PIN_SHA` arg** in Dockerfile.v2 — pinning only the tag without the SHA means cached layers ship the old code.

## Known traps + memory references

1. **`spawn_subprocess_agent` was missing from v16.0–v16.2.** Restored v16.3 (`d2072fb484`). The warning `[mc-worker] spawn_subprocess_agent unavailable` is the smoke signal. See [[project_hermes_v15_14_regressions]].
2. **agent_manifest must walk `HERMES_MC_WORKER_PROFILES`** for multi-profile containers (valiant-crown hosts 4 profiles in one container). Single-profile path stays as fallback. See [[reference_hermes_manifest_registry]].
3. **Customer transcripts live as JSON in per-profile session dirs**, not SQLite. The v16.1 fix searches sibling per-profile session dirs (`41ca98d` / `9c0f434`). If transcripts come back empty post-deploy, check this path.
4. **`HERMES_MC_AGENT_ID` reflects whichever subprocess last wrote container env** — multi-profile containers must use per-row `_profile_agent_id()` for manifest metadata, or all rows label as the host. See `agent_manifest/__init__.py:47`.
5. **Test fleet ≠ prod fleet.** `test-enduru-gateway` may sit on an old rc (e.g. rc9) with a separate DNS issue — not a regression.
6. **`HERMES_MC_BASE_URL` / `HERMES_MC_API_KEY` / `HERMES_MC_GATEWAY_ID` / `HERMES_MC_AGENT_ID` / `HERMES_PROFILE`** are the canonical env vars for plugins to read. Set on every customer + operator container.
7. **Don't read `HOSTNAME` as a bind address** — it's the container ID. Use `0.0.0.0`. See [[feedback_docker_hostname_env]].
8. **op:// secret refs resolve via the hermes-admin-executor socket** on ubuntu-root. See [[reference_admin_executor_1password.md]].
9. **Honcho is alive** — do not propose removing it. Audit `[[project_honcho_alive_not_dead]]`.
10. **valiant-crown writes the shared agent_id env** — for valiant-watcher + valiant-steerer profiles, the per-row metadata must come from `_profile_agent_id()`, not the host env. The "67-68h stale valiant-steerer / valiant-watcher manifests" pre-rc16 was this bug.

## Voice realtime (in-tree, intact)

`gateway/voice_realtime/browser_bridge.py` — the canonical reference impl. The full Amalia persona + tool dispatcher runs inside `AmaliaSession` (`amalia_session.py:823`). When building a new voice surface, compose three layers:

1. `base_instructions` (shared SOUL)
2. `build_tool_specs` (per-profile tool palette)
3. `AmaliaSession.dispatch` (the inline tool dispatcher)

See [[reference_amalia_voice_surface_recipe]] for the bring-up recipe.

## Building goals in this space — invoke `/perfect-goal`

When filing a multi-step goal touching hermes (new plugin, regression fix, fleet rollout, voice surface), invoke `/perfect-goal <topic>`. This skill loads the hermes-specific traps + memory refs into your context; `/perfect-goal` then produces the 13-section goal output with hermes-specific inventory + decision logs filled.

If the project repo (`hermes-agent-enduru` or `enduru-agent-infra`) has a `.perfect-goal/overrides.md`, perfect-goal will pick up project-level required-section overrides + trap-catalog seeds automatically.
