# perfect-goal — OpenClaw agent skill

Drop-in openclaw skill that teaches the agent how to author a 100x-leverage goal prompt. Loaded into the agent's context when relevant prompts appear (multi-step initiatives, rollouts, migrations, infra work, refactors, research).

The skill is **markdown-only** — no programmatic interface, no HTTP endpoint, no plugin runtime. The agent reads `SKILL.md` and the linked `references/*.md`, then drives the three-phase workflow itself using its own LLM context.

This pivots away from the v0.1 HTTP-plugin approach. OpenClaw's path-loaded plugins expose HTTP routes, not agent-callable tools — which made the plugin-based design require an MCP wrapper to actually surface to the agent. Skills are the direct path: they're loaded straight into the agent's context.

## Install (per openclaw host)

```bash
# Clone (or pull) the perfect-goal repo on the openclaw host
git clone https://github.com/apple-techie/perfect-goal ~/perfect-goal

# Symlink the skill into the user's openclaw skills dir
ln -s ~/perfect-goal/agent-skills/openclaw/perfect-goal ~/.openclaw/skills/perfect-goal

# Bundle the framework references into the skill dir
mkdir -p ~/perfect-goal/agent-skills/openclaw/perfect-goal/references
for f in TEMPLATE.md METHODOLOGY.md RUBRIC.md GOAL-TYPES.md; do
  ln -sfn ~/perfect-goal/$f ~/perfect-goal/agent-skills/openclaw/perfect-goal/references/$f
done
ln -sfn ~/perfect-goal/examples/mission-control-unification.md \
        ~/perfect-goal/agent-skills/openclaw/perfect-goal/references/EXAMPLE.md

# Enable in openclaw.json
jq '.skills.entries."perfect-goal" = {"enabled": true}' ~/.openclaw/openclaw.json > /tmp/oc.tmp && mv /tmp/oc.tmp ~/.openclaw/openclaw.json

# Reload the gateway (config-watcher fires on any openclaw.json change)
# OR force restart by SIGKILL'ing the gateway node process; the supervisor respawns it
```

Note: `install.sh` in the repo root automates the symlinks above when run on the openclaw host.

## Per-agent vs gateway-wide

By default, an agent with `skills: null` in openclaw.json sees ALL enabled skills. To scope perfect-goal to specific agents only:

```bash
jq '(.agents.list[] | select(.id == "enduru")).skills = ["perfect-goal"]' ~/.openclaw/openclaw.json
```

(Replace `enduru` with your target agent id.)

## Verify

After enable + reload, the agent's mc-manifest payload includes `perfect-goal` in its `skills:` array:

```bash
grep "mc-manifest.*POST.*HTTP 200" ~/Library/Logs/openclaw/gateway.log | tail -1 | \
  grep -o '"skills":\[[^]]*\]'
# expect: "skills":["perfect-goal", ...]
```

## Layout

```
perfect-goal/
  SKILL.md                 ← trigger description + workflow + output shape
  README.md                ← this file
  references/
    TEMPLATE.md            ← (symlink) 13-section per-slot template
    METHODOLOGY.md         ← (symlink) three-phase workflow depth
    RUBRIC.md              ← (symlink) 44-point quality bar
    GOAL-TYPES.md          ← (symlink) adaptive section matrix
    EXAMPLE.md             ← (symlink) fully-filled worked example
```

## Updating

```bash
git -C ~/perfect-goal pull
# References resolve through symlinks — no further action needed.
# If the agent's session is mid-run, the new SKILL.md will be loaded on next session.
```

## Differences from the Claude Code / Codex skill

The Claude Code + Codex skills (in `skills/perfect-goal/`) bootstrap the framework into Claude / Codex CLI sessions and have access to the host's git + shell for Phase 1 commit-pulling.

This openclaw skill runs inside an openclaw agent's session — same workflow, but Phase 1 commit-pulling happens via the agent's available tools (typically `exec`). The output shape and rubric are identical.

## Upstream

https://github.com/apple-techie/perfect-goal
