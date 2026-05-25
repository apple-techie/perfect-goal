---
name: openclaw
description: Working knowledge of the OpenClaw gateway + agent runtime (Node/TypeScript, runs on Mac + Linux). Use when authoring openclaw plugins (package.json + openclaw.plugin.json + index.js with configSchema), debugging gateway lifecycle, navigating Mac boot-headless (LaunchDaemon + Tailscale .pkg), or planning fleet rollouts. Auto-invokes on mentions of "openclaw", "mc-manifest", "mc-worker", "mc-bridge", "gateway agents", "moltbot-infra/plugins", "tailscale .pkg", "LaunchDaemon", or work in moltbot-infra repos.
---

# OpenClaw — Working Knowledge

OpenClaw is a Node/TypeScript-based agent runtime that hosts multiple agents per gateway. It runs on both Linux (docker containers on ubuntu-root) and macOS (native installs on mac-studio + vm-1/turkules). This skill compresses the high-leverage knowledge for authoring openclaw plugins, navigating the Mac boot-headless trio, and avoiding the traps that cost real engineering time.

If you're filing a multi-step goal involving openclaw, invoke `/perfect-goal` after reading this skill. They compose.

---

## Codebase layout

OpenClaw plugins live at the root of `moltbot-infra`:

```
moltbot-infra/
├── plugins/                         # OpenClaw plugins (canonical location)
│   ├── mc-manifest/                 # Posts gateway manifest → MC every 60s
│   ├── mc-worker/                   # Pulls + executes MC tasks
│   ├── mc-remote/                   # MC-side remote control
│   ├── workspace-api/               # Workspace introspection
│   └── anthropic-attribution-headers/  # PARKED — pending LiteLLM /v1/messages fix
├── openclaw/
│   ├── overlays/                    # Per-gateway runtime overrides
│   │   ├── aurora.json
│   │   ├── sam.json
│   │   └── enduru.json
│   └── scripts/                     # openclaw-setup, deploy-mc-manifest.sh, etc.
├── mac/                             # Boot-headless installers (Macs only)
│   ├── install-mc-bridge-daemon.sh
│   ├── install-openclaw-gateway-daemon.sh
│   ├── migrate-to-official-tailscale-pkg.sh
│   ├── clean-tailscale-reinstall.sh
│   └── install-daily-restart-*.sh
└── scripts/
    └── deploy-mc-manifest.sh
```

## Topology — Mac vs Linux

**Linux (ubuntu-root, dokploy-root):** OpenClaw runs as docker containers. 3 customer gateways currently — `aurora`, `sam`, `enduru`. Reach via `docker exec <name>` NOT SSH (see [[reference_openclaw_gateways_topology]]).

**Mac (mac-studio at 100.85.126.47, vm-1/turkules at 100.87.215.64):** OpenClaw runs as a system LaunchDaemon. Native install. Each Mac runs one gateway with multiple agents:

- `mac-studio`: 1 gateway, 2 agents (`enduru`, `dexter`)
- `vm-1`/`turkules`: 1 gateway tagged `turkules`, 5 agents (`main`, `mv-ops`, `mv-marketing`, `mv-data`, `mv-product`)

The Mac installs went through brew→.pkg recovery on 2026-05-24. The canonical recipe is in `[[reference_mac_openclaw_headless_boot]]`.

## Plugin authoring

### File layout

```
moltbot-infra/plugins/<your-plugin>/
├── package.json             # Node package + openclaw extensions declaration
├── openclaw.plugin.json     # Plugin manifest + configSchema
├── index.js                 # Entry — uses definePluginEntry from openclaw/plugin-sdk
└── README.md
```

### `package.json`

```json
{
  "name": "openclaw-your-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "openclaw": {
    "extensions": ["./index.js"]
  }
}
```

### `openclaw.plugin.json` — REQUIRED configSchema discipline

```json
{
  "id": "your-plugin",
  "name": "Your Plugin",
  "description": "One-line what + why.",
  "version": "1.0.0",
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "yourField": {
        "type": "string",
        "description": "What it does + where it's read from (env fallback, etc.)"
      }
    }
  }
}
```

**CRITICAL:** `additionalProperties: false` is mandatory. Any field passed in config that isn't declared in `properties` will **crash-loop the gateway** (see [[feedback_openclaw_plugin_config_schema]]). Hermes tolerates unknown plugin config; OpenClaw does not.

### `index.js` — minimal example

```javascript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "your-plugin",
  async onStartup({ ctx, config, logger }) {
    logger.info("[your-plugin] starting", { config });

    // Background task example — repeating heartbeat.
    // CAUTION: bare setTimeout chains are KILLED by plugin reloads (the vm-1
    // mc-manifest bug). If you need durability across plugin re-init, register
    // on a lifecycle hook the gateway re-fires on each reload.
    const intervalMs = config.intervalMs || 60_000;
    setTimeout(async function tick() {
      try {
        await doWork(config);
      } catch (err) {
        logger.warn("[your-plugin] tick failed", err);
      }
      setTimeout(tick, intervalMs);
    }, intervalMs);
  },
});

async function doWork(config) {
  // your plugin logic
}
```

### Pitfalls (sorted by how often they bite)

1. **configSchema additionalProperties:false is non-negotiable.** Gateway crash-loops if any undeclared field is in config. (`[[feedback_openclaw_plugin_config_schema]]`)
2. **Plugin reloads kill bare timer chains.** The vm-1 mc-manifest bug: heartbeats schedule, then ~2min later openclaw re-initializes plugins and the `setTimeout` chain is orphaned. Use lifecycle hooks (e.g. `onConfigReload`) to re-arm.
3. **Don't read `HOSTNAME` as a bind address** — container id, not network identity. Use `0.0.0.0`. (`[[feedback_docker_hostname_env]]`)
4. **`GatewayManager` cache is permanent** — changing url/token/kind in MC's DB requires container restart, not SIGHUP. (`[[reference_openclaw_mc_manifest_plugin]]`)
5. **Runtime patches vanish on openclaw-setup re-run, volume restore, or image rebuild.** Three durability tiers (see [[feedback_runtime_patches_lost_on_restore]]):
   - `runtime-overrides.json` (top-level openclaw fields)
   - systemd dropin or post-render hook (per-agent params)
   - bind-mounted `/opt` file-drop (plugins/scripts)
6. **OpenClaw logs flush in bursts.** Trust the DB (tasks table, `gateways.last_seen_at`) over log tails when debugging.
7. **The `api` field in LiteLLM provider configs MUST be `openai-completions`** — `anthropic-messages` silently no-ops per-agent metadata injection until BerriAI/litellm#28082 closes. (`[[reference_openclaw_litellm_provider]]`, `[[reference_litellm_header_to_metadata]]`)
8. **OpenClaw config file path varies by install type:**
   - docker containers (aurora/sam/enduru): `/root/.openclaw/openclaw.json`
   - native macOS: `$HOME/.openclaw/openclaw.json`
   - dev profile: `$HOME/.openclaw-dev/openclaw.json`
   - Honor `OPENCLAW_CONFIG_PATH` env if set (openclaw sets it for the running gateway process).

## MC integration plugins (read these as references)

- **`plugins/mc-manifest/`** — posts gateway manifest (LiteLLM vkey, agent ids, capabilities) to MC every 60s. Normalizes `wss://` → `https://` in agentUrl (commit `49fc64e`). Supports per-agent manifest mode via `perAgentManifests: true` (used by enduru-gateway).
- **`plugins/mc-worker/`** — pulls MC tasks, claims with bare gateway id (NOT `openclaw-<name>`), executes, reports verdict. The kind='hermes' resolver blind-spot for openclaw claims was fixed 2026-05-22 (`f99cc82`). See [[reference_openclaw_task_routing]].
- **`plugins/mc-remote/`** — MC-side remote control surface.
- **`plugins/workspace-api/`** — workspace introspection for MC dashboard.

## Mac boot-headless trio

The canonical setup for headless-boot Mac openclaw hosts (post-2026-05-24 recovery). All three are required; missing any one breaks the trio:

### 1. Tailscale via official `.pkg` + System Extension

Download from `pkgs.tailscale.com` (NOT brew formula — brew is userspace-only, no TUN, no MagicDNS injection, dead-end). The System Extension auto-loads at boot; gives real TUN + all-ports tailnet access.

Migrator: `mac/migrate-to-official-tailscale-pkg.sh` (`b10b8e7` + `36fed0c` for ASCII fix). Includes System Extension approval pause.

### 2. mc-bridge LaunchDaemon (replaces user LaunchAgent)

`mac/install-mc-bridge-daemon.sh` (commit `65acb1c`). Converts `ai.openclaw.mc-bridge` from user-scoped LaunchAgent → system-scoped LaunchDaemon. No GUI login required to start.

### 3. openclaw gateway LaunchDaemon (replaces user LaunchAgent)

`mac/install-openclaw-gateway-daemon.sh` (commit `134666e`). Plist modifications: add `UserName=<human>`, `ProcessType: Background` (not Interactive — system-scoped daemons have no interactive session), add `HOME` env var.

### Mac-specific traps (the 8 from the 2026-05-24 recovery)

1. **macOS Tailscale state lives at `/Library/Tailscale/tailscaled.state`** — NOT `/var/lib/tailscale` like Linux.
2. **`scutil LocalHostName ≠ tailnet hostname`.** Use `hostname -s | tr` and strip `andrews-` prefix when relevant.
3. **`launchctl bootstrap` race "Input/output error 5"** — bootout returns before service fully torn down. Fix: `sleep 4` + retry once.
4. **MagicDNS injection requires .pkg entitlements** — brew tailscaled shows search-domain-only resolver with no nameserver. Workaround: `/etc/resolver/tail3c92ee.ts.net` with `nameserver 100.100.100.100`.
5. **Bash `set -u` + unicode `…`** parses as variable name `VAR…`, unbound. Use ASCII `...`.
6. **`/usr/local/bin/tailscale` shim execs nonexistent `/opt/homebrew/bin/tailscale`** after brew uninstall. Use `/Applications/Tailscale.app/Contents/MacOS/Tailscale` (bundle-aware).
7. **Direct symlink of Tailscale binary fails** — "Fatal error: The current bundleIdentifier is unknown to the registry." Needs bundle context.
8. **Sticky `-N` hostname suffix in Tailscale admin** — orphan nodes hold the bare name. Delete old nodes first, then edit machine name with auto-generate OFF.

## Nightly auto-restart

Mac openclaw degrades over multi-day runs (plugin-POST pile-up). Both Macs have staggered nightly restarts:

- `mac-studio`: 03:14 (`5ad9268`)
- `vm-1`: 03:07

Installed via `mac/install-daily-restart.sh <minute>`. LaunchDaemon-driven post-boot-headless migration.

## Known traps + memory references

1. **The vm-1 mc-manifest reload bug** (currently open) — gateway re-initializes plugins ~2min after start, killing the pending mc-manifest heartbeat task. Symptoms: turkules red on MC despite gateway running. See `examples/mission-control-unification.md` gap #1.
2. **`fs.inotify.max_user_instances=128`** is Ubuntu default; bumps containers in <1s with empty logs on >50-container hosts (tailscaled EMFILE). Bumped to 8192 on ubuntu-root + dokploy-root. (`[[feedback_fleet_inotify_limit]]`)
3. **OpenClaw 5.x changed plugin extension key** from `runtimeExtensions` to `openclaw.extensions` in `package.json` (`a3055c1`).
4. **`api.registerService` is a noop in 5.x** — mc-worker bypasses it and starts poll directly (`f56e0c2`).
5. **`mc_remote` HTTP routes in openclaw 5.x** were broken — fix in `50b1f94`.
6. **OAuth provider expiry kills Dokploy auto-deploys silently** — Andrew922 token id `InLtqXztFMPWu67DVUt9N` per [[reference_dokploy_gitlab_providers]].
7. **Don't proactively run `sessions cleanup --enforce`** — Drew values session history. See [[feedback_dont_prune_openclaw_sessions]].
8. **codex CLI 0.132.0 hangs** on any non-interactive invocation, stalling `brew upgrade` on completion-gen. Fix: `pkill -9 -f 'codex.*completion'`. ([[feedback_codex_cli_brew_hang]])
9. **MC dispatch handler** must set `gateway_id` (via manifest lookup, with `hermes-` prefix stripping) + `dispatch_status='idle'` + leave `status=backlog` or the worker's claim 422/404/409s and blacklists silently. See [[reference_mc_hermes_dispatch_path]].
10. **openclaw-<name> gatewayId mismatch** — worker gatewayId MUST be bare name (not `openclaw-<name>`); aurora's `gatewayId=aurora` was runtime-patched and needs Dokploy rebake to bake in. ([[reference_openclaw_task_routing]])

## Deploy flow

Most openclaw plugins deploy via `moltbot-infra/scripts/deploy-mc-manifest.sh` (or similar per-plugin script). For Mac hosts: changes to plugins must be either:

1. Bind-mounted into `/opt` on the Mac (durability tier 3)
2. Or shipped as part of an openclaw upgrade (durability tier 1, but blows away local config)

For Linux containers: rebuild the container image with the new plugin layer, push to Dokploy.

## Building goals in this space — invoke `/perfect-goal`

When filing a multi-step goal touching openclaw (new plugin, gateway lifecycle fix, fleet hygiene, Mac boot-headless work), invoke `/perfect-goal <topic>`. This skill primes your context with the openclaw-specific traps + memory refs; `/perfect-goal` then produces the 13-section goal output with openclaw-specific inventory + the trap catalog seeded.

If the project repo (`moltbot-infra`) has `.perfect-goal/overrides.md`, perfect-goal picks it up automatically.
