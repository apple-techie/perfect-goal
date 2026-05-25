# `perfect-goal` — OpenClaw plugin

Exposes the Perfect Goal framework as a callable tool inside openclaw agents. When invoked, the tool returns the full framework (methodology + 13-section template + 44-point rubric + goal-type matrix) primed with the caller's topic as Phase 1 context. The agent then continues the workflow in its own LLM context.

## Install

```bash
# Clone perfect-goal next to your moltbot-infra repo
git clone https://github.com/apple-techie/perfect-goal ~/code/perfect-goal

# Symlink the plugin dir into moltbot-infra/plugins/
ln -s ~/code/perfect-goal/plugins/openclaw/perfect-goal \
      ~/code/moltbot-infra/plugins/perfect-goal

# Symlink the framework docs into the plugin so index.js can read them
mkdir -p ~/code/perfect-goal/plugins/openclaw/perfect-goal/framework
for f in TEMPLATE.md METHODOLOGY.md RUBRIC.md GOAL-TYPES.md; do
  ln -sfn ~/code/perfect-goal/$f \
          ~/code/perfect-goal/plugins/openclaw/perfect-goal/framework/$f
done

# Deploy per your fleet's plugin deploy flow:
#   - Mac hosts: bind-mount into /opt or rebuild the openclaw install
#   - Linux containers: rebuild image with the new plugin layer + redeploy Dokploy
```

After deploy, openclaw agents with this plugin loaded gain the `perfect_goal` tool.

## Tool signature

```
perfect_goal({
  topic: string,             // required — one-line description or 'from recent history'
  type?: string,             // bug|feature|migration|infra|research|refactor|unification|auto
  scope?: string,            // tight|wide  (default tight)
  tier?: string,             // A|AB|ABC    (default AB)
  window?: number,           // commits per repo in Phase 1 (default 40)
  repos?: string[]           // auto-detect if omitted
}) -> {
  topic, flags, instructions, framework, version, upstream
}
```

## Configuration

Per-gateway config in `openclaw.json` under `plugins.entries["perfect-goal"].config`:

```json
{
  "plugins": {
    "entries": {
      "perfect-goal": {
        "config": {
          "frameworkPath": "/opt/perfect-goal-framework",
          "defaultType": "auto",
          "defaultScope": "tight",
          "defaultTier": "AB"
        }
      }
    }
  }
}
```

All config fields are optional. `frameworkPath` defaults to `<plugin_dir>/framework/` which install.sh symlinks at install time.

## Example invocation from an openclaw agent session

```
> Build a goal for migrating our voice modal off the task table.

Tool call: perfect_goal({ topic: "voice modal off tasks table — eliminate dashboard pollution and cut latency", type: "feature" })

[tool returns framework payload]

Output: a 13-section goal prompt with the feature-type required sections filled.
```

## Design notes

The plugin is **deliberately thin** — no LLM calls from inside the plugin. The synthesis happens in the calling agent's own context. Benefits:

- Works identically across all openclaw agent backends (Claude / Grok / LiteLLM / local).
- No additional API spend per `perfect_goal` call beyond the agent's session cost.
- No race conditions between plugin-side LLM state and agent session state.
- No external network dependency at tool-invocation time — only at plugin install (when framework files are fetched into the bundled `framework/` dir).

## Updating the framework

In your perfect-goal clone:

```bash
git -C ~/code/perfect-goal pull
```

The symlinks in `framework/` resolve to the new files automatically. Bump the plugin's `version` in `package.json` if you want openclaw to log the framework version on load.

## Pitfalls

1. **configSchema additionalProperties:false enforcement** — any field you pass in config that isn't declared in `openclaw.plugin.json` will crash-loop the gateway. The schema is explicit; respect it. (`[[feedback_openclaw_plugin_config_schema]]`)
2. **Framework files missing at startup** — index.js degrades gracefully (logs warning, returns empty strings for absent files). The plugin still loads but the response is less useful. Always symlink the 4 framework files at install.
3. **Plugin reloads kill bare timer chains** — this plugin doesn't use timers, but if you're forking it to add background work, see the vm-1 mc-manifest bug for the pattern that breaks (`examples/mission-control-unification.md` gap #1).
4. **Runtime patches vanish on openclaw-setup re-run / volume restore / image rebuild** — see [[feedback_runtime_patches_lost_on_restore]]. If you bind-mount the plugin into `/opt`, it survives container rebuilds. Plugin-dir installs via openclaw-setup do not.
5. **`api: openai-completions`** — if you're building a fork of this plugin that calls LiteLLM directly, keep providers on `openai-completions` until BerriAI/litellm#28082 closes. `anthropic-messages` silently drops metadata.

## Upstream

Framework + rubric + template: https://github.com/apple-techie/perfect-goal

Read the repo's `METHODOLOGY.md` for workflow details and `RUBRIC.md` for the 44-point quality bar.
