# `perfect_goal` — Hermes plugin

Exposes the Perfect Goal framework as a callable tool inside hermes agents. When called, the tool returns the full framework (methodology + 13-section template + 44-point rubric + goal-type matrix) with the caller's topic primed as Phase 1 context. The agent then continues the workflow in its own LLM context.

## Install

```bash
# Clone perfect-goal next to your hermes-agent repo
git clone https://github.com/apple-techie/perfect-goal ~/code/perfect-goal

# Symlink the plugin dir into hermes-agent's plugins/
ln -s ~/code/perfect-goal/plugins/hermes/perfect-goal \
      ~/code/hermes-agent-enduru/plugins/perfect_goal

# Symlink the framework docs into the plugin so __init__.py can read them
mkdir -p ~/code/perfect-goal/plugins/hermes/perfect-goal/framework
for f in TEMPLATE.md METHODOLOGY.md RUBRIC.md GOAL-TYPES.md; do
  ln -sfn ~/code/perfect-goal/$f \
          ~/code/perfect-goal/plugins/hermes/perfect-goal/framework/$f
done

# Restart the gateway / rebuild + recreate per fleet update flow
```

After install, hermes profiles that load this plugin gain the `perfect_goal` tool. To enable per profile, add `perfect_goal` to the profile's toolset list (or load all standalone plugins, whichever your config uses).

## Tool signature

```
perfect_goal(
    topic: str,                       # required — one-line goal description
                                      # or 'from recent history'
    type: str = "auto",               # bug|feature|migration|infra|research|
                                      # refactor|unification|auto
    scope: str = "tight",             # tight|wide
    tier: str = "AB",                 # A|AB|ABC
    window: int = 40,                 # commits per repo to review
    repos: list[str] | None = None,   # auto-detect if None
) -> dict   # JSON-encoded — agent reads it as structured fields
```

## What the tool returns

```json
{
  "topic": "<your topic>",
  "flags": { "type": "...", "scope": "...", "tier": "...", "window": ..., "repos": [...] },
  "instructions": "<3-phase workflow primer>",
  "framework": {
    "methodology": "<full METHODOLOGY.md>",
    "template": "<full TEMPLATE.md>",
    "rubric": "<full RUBRIC.md>",
    "goal_types": "<full GOAL-TYPES.md>"
  },
  "version": "0.1.0",
  "upstream": "https://github.com/apple-techie/perfect-goal"
}
```

The agent reads this payload, loads the framework into its context, and produces the 13-section goal output as the next turn's reply.

## Example invocation from a hermes session

```
> Build me a goal for fixing the vm-1 mc-manifest reload bug.

Tool call: perfect_goal(topic="vm-1 openclaw mc-manifest plugin reload kills heartbeat timer", type="bug")

[tool returns the framework payload]

Output: a 13-section goal prompt with the bug-type required sections filled.
```

## Design notes

The plugin is **deliberately thin** — it does not call an LLM directly. The synthesis work happens in the calling agent's LLM context, which means:

- Works identically across any hermes backend (anthropic/grok/litellm/local).
- No additional API spend per `perfect_goal` call beyond the agent's own session cost.
- No race between plugin-side LLM call and the agent's session state.

The cost is that the agent must continue the workflow itself after receiving the framework. That's fine — it's what the framework is designed for.

## Updating the framework

When the perfect-goal repo ships a new framework version, just `git pull` in your local perfect-goal clone. The symlinks resolve to the new files automatically. Bump the plugin's `version` in `plugin.yaml` if you want hermes to log the framework version on load.

## Pitfalls

- **Framework files missing** — `__init__.py` degrades gracefully (logs a warning, returns empty strings for missing files). The plugin still loads but the response is less useful. Always symlink the 4 framework files into `framework/` at install time.
- **Don't read HOSTNAME** as an external identifier — the plugin doesn't, but if you're modifying it, see [[feedback_docker_hostname_env]].
- **Plugin not loading?** Check `pyproject.toml` includes `plugins/**/plugin.yaml` in package-data — the v16.1 fix at `28be8f2527`. If you're shipping this plugin in a customer wheel build, this is the trap.

## Upstream

Framework + rubric + template: https://github.com/apple-techie/perfect-goal

Read the repo's `METHODOLOGY.md` for the three-phase workflow details and `RUBRIC.md` for the 44-point quality bar.
