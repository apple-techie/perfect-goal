---
goal_id: mc-unification-2026-05
owner: Andrew Peltekci
opened_at: 2026-05-25
target_close: 2026-06-08
status: open
type: unification
tier: AB
scope: wide
priority: P0
repos:
  - /Users/andrewpeltekci/Documents/1_Projects/mission-control
  - /Users/andrewpeltekci/Documents/1_Projects/moltbot-infra
  - /Users/andrewpeltekci/Documents/1_Projects/hermes-agent-enduru
  - /Users/andrewpeltekci/Documents/1_Projects/enduru-agent-infra
memory_root: /Users/andrewpeltekci/.claude/projects/-Users-andrewpeltekci-Documents-1-Projects-mission-control/memory
---

# /goal — Mission Control unified fleet substrate, 2026-05-25

> This file is the **canonical example** of a Perfect Goal output. It's the bootstrap goal that produced this framework, filled in for real. Use it as a reference when writing your own goals.

---

## 1. Strategic anchor

### 1.1 North Star (one sentence)

Mission Control is the single pane of glass over my entire compute fleet — every gateway in one truthful list, every task dispatchable end-to-end across both protocols with rendered diffs, every voice turn sub-second without polluting the task dashboard, and every host (especially the Macs) self-healing through cold reboots with zero physical intervention.

### 1.2 The 5 Whys

1. **Why unify MC?** Because I currently use 4 different surfaces to see + act on the fleet, and they disagree about which gateways are online.
2. **Why does disagreement matter?** Because I make trust decisions on what MC tells me — when it says "red" for a healthy gateway, I waste 30+ min investigating phantoms; when it says "green" for a broken one, the real issue compounds.
3. **Why does trust in MC matter for my velocity?** Because I run 35+ projects and the only way I stay above water is by trusting status displays to filter what needs attention. Untrusted displays = inbox-zero applied to my fleet, which collapses my velocity by ~40%.
4. **Why does velocity matter at this stage?** Because I'm building toward Series A with bootstrap engineering capacity; every hour spent on phantom debugging is an hour not spent on the artifacts that close the raise.
5. **Why is the raise the constraint?** Because runway determines whether I keep founder equity or get diluted to the point where the company's strategic direction is no longer mine.

### 1.3 Counter-position (steel-manned)

**Strongest argument against:** "MC is 90% there. The remaining gaps are cosmetic — one red dot on a host that's actually fine, voice that's slow but works, side-quests that don't block any deploy. Closing them takes 1–2 weeks of engineering that could go into the Stripe billing migration which is actually customer-visible. Ship what works, defer the rest, focus on revenue."

**Counter:** The voice latency isn't cosmetic — it directly affects how often I use MC at all (5–9s per turn means I stop reaching for the voice modal, which means I stop reaching for MC for fast queries). The red-dot-on-healthy is exactly the trust-collapse failure described in why #2 — it's not the dot, it's that I now have to second-guess every dot. And the Stripe migration's success metric (per-gateway billing accuracy) DEPENDS on MC showing accurate gateway state. Closing the MC gaps is on the critical path to billing, not parallel to it.

### 1.4 Why this matters NOW

The 2026-05-20 upstream hermes merge silently dropped 4 fork customizations, causing a fleet-wide task-dispatch outage masked by concurrent dashboard unification work. v16.3 (`d2072fb484`) restored execution on 2026-05-24. The 2026-05-22 vm-1 mc-bridge 403 cascade exposed how brittle the openclaw→MC trust chain is. We're 1 week from the planned Stripe usage-billing cutover (target 2026-06-01) which requires per-gateway accuracy. Each day of MC drift = one less day to debug billing edge cases pre-cutover.

---

## 2. Ground truth

### 2.1 Authoritative inventory

**Hermes customers (8):** deployed via Dokploy compose, each at `https://<slug>.enduru.ai`. Hermes pin in `enduru-agent-infra/Dockerfile.v2` (currently `a0b1cbd` → `enduru-mc-v16.3` / `d2072fb484-v16.3`). Gateway WS RPC over wss; manifests POST to `https://mc.enduru.ai/api/manifests` every 60s.

**Operator hermes personas (4)** on dokploy-root — `hermes-default` (:8641), `hermes-fast` (:8662), `hermes-watcher`, `hermes-deep`. Two run `network_mode: host`; MC reaches them via `host.docker.internal` + UFW rule from `172.20.0.0/16`. Fleet built from `/srv/hermes-fleet-repo` via `scripts/update-internal-fleet.sh enduru-mc-v16.3`. See [[reference_hermes_host_mode_reach]].

**OpenClaw on ubuntu-root (3 containers):** `aurora`, `sam`, `enduru` — Docker, reached via `docker exec <name>` NOT SSH. All flipped observe→execute in `4ccf85e`/`528e048`/`33c06f2`/`a7206dc`. See [[reference_openclaw_gateways_topology]].

**OpenClaw on Mac (2 hosts):**
- `mac-studio` (100.85.126.47): 1 gateway, 2 agents (`enduru`, `dexter`)
- `vm-1` aka `turkules` (100.87.215.64): 1 gateway tagged `turkules`, 5 agents (`main`, `mv-ops`, `mv-marketing`, `mv-data`, `mv-product`)

Both went through brew→.pkg recovery on 2026-05-24 (see [[reference_mac_openclaw_headless_boot]]). Both have nightly LaunchDaemon restarts (`5ad9268`) staggered at 03:14 / 03:07.

**Servers:**
- `dokploy-root` (100.96.231.47 tailnet): Dokploy + Traefik + LiteLLM + 8 customer hermes + 4 operator hermes
- `ubuntu-root` (100.108.32.10): openclaw containers + admin-executor daemon + Whisper STT at whisper.jmwalker.dev
- `oracle`, `linode-root`: ancillary

Drew's username on turkules is `ll0rgge` (see [[reference_turkules_ll0rgge_user]]).

**LiteLLM** at `https://litellm.enduru.ai` on dokploy-root. `LITELLM_ADMIN_KEY` in MC compose env feeds usage page. HeaderToMetadata callback hoists `x-litellm-metadata-agent-id` → `spend_logs.agent_id` for `/v1/chat/completions` only (see [[reference_litellm_header_to_metadata]]).

**OAuth provider** for Dokploy gitlab pulls: `Andrew922` (`InLtqXztFMPWu67DVUt9N`). Token refreshed via Dokploy UI 2026-05-24; re-expiry possible at any time (see [[reference_dokploy_gitlab_providers]]).

### 2.2 Current state (~90% — receipts table)

| Workstream | Status | Key commits / artifacts | Verification |
|---|---|---|---|
| Phase 0/1/2 dashboard unification | Shipped (live in prod) | `3de1ba2` → `c502661` → `50150f6` `7861da0` `0cef833` `ca06a03` `b3031f4` `1edfea6` | All 6 `NEXT_PUBLIC_MC_UNIFY_*_VIEW=1` in `docker-compose.deploy.yml`; build-log grep confirms |
| OpenClaw status accuracy | Shipped + deployed | `848d2d4` (RPC v4), `b8c7415` (per-agent enum), `4ca7f40` (roster regardless of freshness), `f81467c` (manifest-fresh fallback) | mac-studio last_seen=26s green; turkules still red (gap #1) |
| MC task dispatch across both protocols | Shipped | `4ccf85e` `528e048` `33c06f2` `a7206dc` `f99cc82` `5841613` `2537ef0` | aurora/sam/enduru workers all observe→execute with canonical IDs |
| Hermes v16 regression chain fixed | Rolled to operator; customer rollout in-flight | `28be8f2527` (v16.1 plugins), `9c0f434` (customer load), `52836b178a` (v16.2 gateway_runner), `d2072fb484` (v16.3 spawn), `a0b1cbd` (customer pin bump) | Operator on v16.3; customer rollout = gap #3 |
| Mac boot-headless trio | Shipped + reboot-verified | `65acb1c` (mc-bridge daemon), `b10b8e7`+`36fed0c` (Tailscale .pkg migrator), `134666e` (gateway daemon) | vm-1 cold-rebooted 2026-05-24; tailnet ssh open at +13s, last_seen=13s |
| Voice P3.PR1→PR4 native modal | Shipped behind flag | `d5cefbe` (endpoints), `cd4fa23` (modal), `bce0842` (VAD), `e868b25` (continuous), `6d3a39d` (streaming MP3) | Works but slow + noisy on dashboard (gap #4) |

### 2.3 Recent evidence anchor

vm-1 gateway log, 2026-05-24 21:10:26–21:12:28 (verbatim):
```
21:10:26 [mc-manifest] heartbeat scheduled (5000ms initial, then every 60000ms)
21:10:26 [gateway] http server listening (8 plugins: ...)
21:10:31 [mc-manifest] POST → HTTP 200
21:11:31 [mc-manifest] POST → HTTP 200
21:12:28 [mc-manifest] heartbeat scheduled (5000ms initial, then every 60000ms)   ← re-init
<silence for 41+ min, gateway still running, PID 12107>
```

Monitor output from MC dashboard, 2026-05-25 13:21:
```
mac-studio: last_seen=26s
turkules:   last_seen=816s
```

---

## 3. Gap decomposition

### 3.1 — vm-1 mc-manifest stops posting after plugin re-init (turkules red dot)

#### 3.1.1 Observed signal
See §2.3.

#### 3.1.2 Hypothesis tree
- **H1:** openclaw config file watcher fires on a touched file → plugin reload, but the second `setTimeout` chain dies because the prior heartbeat task's closure references an orphaned plugin context. (most likely; matches log timing)
- **H2:** sparkle auto-updater check at +2min boundary triggers a `relaunch` codepath that re-instantiates plugins without tearing down their timers cleanly. (plausible; matches 2-min cadence)
- **H3:** another plugin's `onChange` config emit cascades into a gateway `plugins.reload()` call; mc-manifest registers a heartbeat but loses it on the next re-emit.
- **H4:** mc-bridge or another LaunchDaemon writes a file under `~/.openclaw/` that openclaw watches, causing self-triggered reloads.

#### 3.1.3 Pre-staged investigation
```bash
ssh vm-1 'grep -E "loading|restart|update|signal|sparkle|relaunch|exit|reload|onChange|watch" ~/Library/Logs/openclaw/gateway.log | tail -60'
ssh vm-1 'sed -n "/21:11:31/,/21:13:30/p" ~/Library/Logs/openclaw/gateway.log'
ssh vm-1 'fs_usage -w -f filesys openclaw 2>/dev/null | head -200'
ssh vm-1 'sudo launchctl print system/ai.openclaw.gateway | grep -E "state|pid|spawn"'
ssh vm-1 'defaults read ai.openclaw.gateway 2>/dev/null; ls -la ~/Library/Application\ Support/openclaw/ 2>/dev/null'
```

#### 3.1.4 Fix paths (cost-ordered)
1. **Cheapest (15 min, low risk):** disable openclaw sparkle auto-updater on vm-1 + mac-studio. `defaults write ai.openclaw.gateway SUEnableAutomaticChecks -bool false` + restart. If reloads stop → confirms H2.
2. **Medium (2 hr, medium risk):** patch the mc-manifest plugin's heartbeat to register on the gateway's `pluginsReady`/`afterReload` lifecycle event so it re-arms after each reload. Code in `moltbot-infra/openclaw/plugins/mc-manifest/`.
3. **Surgical (1 day, high risk):** root-cause the openclaw plugin reload loop; if from a benign config-file-write loop (H4), suppress the write or move the file outside openclaw's watch glob.

#### 3.1.5 Rollback procedure
Re-enable sparkle: `defaults write ai.openclaw.gateway SUEnableAutomaticChecks -bool true` + `sudo launchctl kickstart -k system/ai.openclaw.gateway`. For patch rollback: revert the mc-manifest plugin commit + redeploy via `moltbot-infra/scripts/deploy-mc-manifest.sh`.

#### 3.1.6 Reproduces also on
**Unknown — needs probe.** mac-studio is currently green. May be vm-1-specific (VM clock, plugin set, FS) or latent on mac-studio. Tail both gateway logs for 4h to characterize.

#### 3.1.7 Success metric
`SELECT last_seen_at FROM gateways WHERE id='turkules'` returns <90s old, sustained for ≥24h, with `mc-manifest POST → HTTP 200` lines appearing in vm-1 gateway log at the 60s cadence with no >120s gap.

---

### 3.2 — Anthropic attribution headers parked pending upstream

#### 3.2.1 Observed signal
LiteLLM `/v1/messages` translation layer drops `x-litellm-metadata-agent-id` header before spend_logs insert. Per-agent attribution silently no-ops. Plugin parked at `moltbot-infra/plugins/anthropic-attribution-headers/` (`0353186`).

#### 3.2.2 Hypothesis tree
- **H1:** Upstream BerriAI/litellm#28082 patches the translation layer; our parked plugin then deploys cleanly. (most likely; just a wait)
- **H2:** Upstream stalls; we fork+patch LiteLLM. (escalation path)

#### 3.2.3 Pre-staged investigation
Weekly check via cron or calendar event:
```bash
gh issue view BerriAI/litellm#28082 --json state,closedAt,milestone
```

#### 3.2.4 Fix paths (cost-ordered)
1. **Cheapest (5 min/week):** monitor upstream issue. On close, deploy parked plugin.
2. **Medium (2 hr):** deploy plugin + flip openclaw providers `api: anthropic-messages`. Verify spend_logs.agent_id populated.
3. **Escalation (1 week):** fork LiteLLM, patch the translation drop, run our own image.

#### 3.2.5 Rollback procedure
If providers were flipped: edit openclaw config back to `api: openai-completions`, restart gateways. If our plugin shipped a regression: `git revert` the plugin deploy in `moltbot-infra`, redeploy.

#### 3.2.6 Reproduces also on
**Yes** — ALL openclaw → LiteLLM `/v1/messages` requests are affected. Currently masked by keeping all openclaw providers on `openai-completions`.

#### 3.2.7 Success metric
Plugin deployed, providers flipped, 50+ openclaw `/v1/messages` requests logged with `agent_id` populated in spend_logs over 1h sample period.

---

### 3.3 — Verify v16.3 customer rollout actually landed on all 8

#### 3.3.1 Observed signal
Customer pin bump `a0b1cbd` (`enduru-mc-v16.2` → `enduru-mc-v16.3`) committed 2026-05-24. Operator fleet (4 personas) confirmed on v16.3. Customer rollout state unverified across 8 customers.

#### 3.3.2 Hypothesis tree
- **H1:** All 8 customers auto-rolled via Dokploy webhook on push. (most likely)
- **H2:** Some customers' Dokploy compose env blocked the auto-roll. (plausible per [[reference_mc_nextpublic_flag_flip]])
- **H3:** OAuth token expired mid-roll on one or more customers. (worth checking per [[reference_dokploy_gitlab_providers]])

#### 3.3.3 Pre-staged investigation
```bash
ssh dokploy-root 'for slug in $(psql -t -c "SELECT DISTINCT name FROM compose WHERE name LIKE '\''enduru-%'\''"); do
  echo "=== $slug ===";
  docker exec ${slug}_hermes-1 sh -c "git -C /srv/hermes-worker/hermes-agent rev-parse HEAD" 2>/dev/null | head -1;
done'
```
Expected: every customer hermes container at commit `d2072fb484` (v16.3 head) or descendant.

End-to-end smoke per customer: dispatch one `valiant-watcher` "watcher sweep" task, confirm backlog → done in <90s with no `spawn_subprocess_agent unavailable` warning.

#### 3.3.4 Fix paths (cost-ordered)
1. **Cheapest (auto):** Dokploy webhook auto-rolled all 8. Verify only.
2. **Medium (15 min per stuck customer):** `POST /api/compose.deploy` to dokploy API for each stuck customer. Verify after.
3. **Surgical (1 hr):** debug per-customer compose env / OAuth state if rollout failed.

#### 3.3.5 Rollback procedure
Bump customer pin back to v16.2 via `enduru-agent-infra/Dockerfile.v2` revert + commit + push to gitlab; Dokploy auto-rolls.

#### 3.3.6 Reproduces also on
N/A — single rollout event.

#### 3.3.7 Success metric
All 8 customers on `d2072fb484`+; one test task drained per customer; zero `spawn_subprocess_agent unavailable` warnings fleetwide for 24h post-verification.

---

### 3.4 — Voice surface: dashboard pollution + 5–9s p50 latency

#### 3.4.1 Observed signal
`src/components/native-voice-modal.tsx:221-243` POSTs `/api/tasks` for every utterance with `source:"voice_modal"`. Dashboard queries don't filter on `source`. Result: every voice turn becomes a tasks row.

Latency measured over 20 turns: p50 5500ms, p95 9000ms. Breakdown:
- transcribe: 500–1500ms
- task create: 100–250ms
- claim poll @1Hz: 0–1000ms
- **`spawn_subprocess_agent`: 3000–5000ms (dominant)**
- inference + tools: 800–3000ms
- result write: 50ms
- dispatch-status poll @1Hz: 0–1000ms
- synthesize TTFB: 200–500ms
- first playback: 50ms

#### 3.4.2 Hypothesis tree
- **H1:** P3.PR2 was the right design at the time (Hermes-identity parity) but the subprocess spawn is fundamentally the wrong primitive for sub-second voice. (confirmed; matches latency profile)
- **H2:** Dashboard pollution is purely a query filter omission. (confirmed; the `source` marker exists)
- **H3:** Subprocess cost can be amortized via a long-lived "voice worker" subprocess that handles many turns. (plausible Phase A optimization)

#### 3.4.3 Pre-staged investigation
- Measure p50 in browser DevTools network panel + `console.time` instrumentation. Confirm subprocess is the dominant cost.
- Read `hermes-agent-enduru/gateway/voice_realtime/browser_bridge.py` lines 1-100 to confirm realtime stack is intact + still works for Discord/Meet.
- Verify openclaw bots have voice-bridge endpoints (not in scope; informational).

#### 3.4.4 Fix paths (cost-ordered)
1. **Phase A (1 day, low risk):**
   - Add `POST /api/voice/run` route — calls hermes WS RPC directly, no tasks table.
   - Stream response back as SSE so TTS overlaps with later generation.
   - Modal swaps `/api/tasks` POST for `/api/voice/run` consumption.
   - Filter `source != 'voice_modal'` from dashboard queries for backwards compat with pre-existing rows.
   - Expected p50: ~3500ms (still subprocess-bound but no task/poll overhead).
   - Dashboard pollution: zero new rows.
2. **Phase B (2–3 days, medium risk):**
   - New `WS /api/voice/realtime` route proxies browser ↔ `voice_realtime/browser_bridge.py` on hermes-fast.
   - Unified modal toggles: fast (realtime, <800ms p50) vs deep (Phase A, ~3500ms p50).
   - Default = fast. Deep is opt-in for tool-using turns.
   - Identity bridging deferred (Phase C, NOT in scope).

#### 3.4.5 Rollback procedure
Revert the `/api/voice/run` route + restore the `/api/tasks` POST in the modal. For Phase B: feature-flag the `/api/voice/realtime` route off via `NEXT_PUBLIC_MC_VOICE_BACKEND=native`.

#### 3.4.6 Reproduces also on
Dashboard pollution: only the voice modal creates `source:"voice_modal"` rows; no other surface. Latency: any subprocess-spawn-per-turn path has the same profile (would affect future "AI-driven Slack reply" etc. surfaces).

#### 3.4.7 Success metric
- Zero `source='voice_modal'` rows visible in MC task dashboard after fix.
- Phase A: voice turn p50 first-audio <4000ms, measured over 20 turns.
- Phase B: voice turn p50 first-audio <800ms, p95 <1500ms (fast mode); deep mode still works (regression check).
- Voice turn against `hermes-fast` and against any openclaw agent both complete cleanly.

---

### 3.5 — Two Kaino OAuth providers expired in Dokploy
*(Condensed: see [[reference_dokploy_gitlab_providers]] for details. Action: Drew refreshes Sannidhya-owned providers via Dokploy UI. Success: both green, test deploy of each affected Kainotomic repo confirms gitlab clone works.)*

### 3.6 — Nightly Mac openclaw restart verification
*(Condensed: verify `5ad9268` LaunchDaemon-driven restarts fire post-boot-headless. Success: both daemons fired in last 24h; gateway PID changed at expected minute; no error logs from restart.)*

### 3.7 — Dashboard unification regression sweep
*(Condensed: focused regression pass on all 6 unified views across 4 gateway flavors. Success: all render correctly, no console errors, no empty states for healthy gateways.)*

---

## 4. Success metrics (multi-axis)

### 4.1 Outcome metrics
- All ~17 gateways green in MC, `last_seen <90s`, sustained 24h.
- Voice turn p50 first-audio <800ms (Phase B fast mode) or <4000ms (Phase A) measured over 20 turns.
- Cold reboot of any host → reappears green within 5min, zero manual intervention.

### 4.2 Output metrics
- Phase A `/api/voice/run` endpoint deployed at `src/app/api/voice/run/route.ts`.
- Phase B `/api/voice/realtime` WS endpoint deployed.
- Closure memory file at `<memory_root>/project_mc_unification_closed.md` with verification receipts.
- One regression PR per gap closure.

### 4.3 Leading indicators (hours–days)
- vm-1 gateway log shows >5 consecutive `mc-manifest POST → HTTP 200` lines at 60s cadence post-fix.
- Phase A endpoint deploys cleanly to staging, manual test turn completes.
- v16.3 customer pin verification script returns 8/8 customers on `d2072fb484`+.

### 4.4 Lagging indicators (24h+)
- Zero `spawn_subprocess_agent unavailable` warnings fleetwide for 24h.
- Zero `source='voice_modal'` rows created in tasks table over 24h of usage.
- `last_seen <90s` for all ~17 gateways sustained 24h.

### 4.5 Anti-metrics (hard ceilings)
- MC API p99 latency must NOT exceed 800ms (current baseline ~400ms p99). Voice work adds RPC paths; regress and the goal fails.
- Hermes customer task error rate must NOT exceed 0.5%/hr (current baseline ~0.1%).
- Cloud spend delta must NOT exceed +$50/mo for the duration of the goal.
- No new operator pages (PagerDuty volume must stay flat or decline).

### 4.6 Cost budget
- **Engineering hours:** 40hrs estimated total; cap at 60hrs before re-scoping.
- **Dollars:** ~$0 marginal (existing infrastructure); +$50/mo ceiling if a new service is required.
- **Opportunity cost:** delays Stripe usage-billing readiness by 1–2 days if executed end-to-end; we're already 1 week ahead of the 2026-06-01 cutover target so this is absorbed.

### 4.7 Quality gates (per artifact)
- Phase A `/api/voice/run` route: unit test for SSE chunk emission; integration test that a voice turn completes <4000ms p50; no `spawn_subprocess_agent` warning in test run.
- Phase B `/api/voice/realtime`: WS proxy test; latency benchmark <800ms first-audio.
- vm-1 mc-manifest fix: 24h soak with `last_seen <90s` before closure.
- v16.3 customer verification: paste-able output of the `git rev-parse HEAD` loop for all 8 customers.

### 4.8 Time-boxed checkpoints
| Day | Deliverable | Check-in |
|---|---|---|
| 1 (2026-05-25) | Goal filed + Phase 1 confirmation + sub-agent fan-out planned | Self |
| 3 (2026-05-27) | Gap #1 closed (turkules green, 24h soak begun) + Phase A endpoint deployed | Self |
| 5 (2026-05-29) | Phase A measured + dashboard pollution = 0 | Self |
| 8 (2026-06-01) | Phase B realtime endpoint deployed + measured <800ms p50 | Self |
| 14 (2026-06-08) | All 13 verification matrix rows green + closure memory written | Self |

---

## 5. Verification matrix

| # | Criterion | How to verify |
|---|---|---|
| 1 | All ~17 gateways green in MC | `curl -s https://mc.enduru.ai/api/gateways/all \| jq '[.[] \| select(.status != "online")] \| length'` → `0` |
| 2 | last_seen <90s for every gateway | Same endpoint; `max(last_seen_seconds_ago) < 90` |
| 3 | Test task dispatched to each of 4 gateway flavors completes | 4 test tasks via MC UI, each goes backlog → done with rendered diff in <2min |
| 4 | Cold reboot of vm-1 + mac-studio → both green within 5min, zero intervention | `ssh <host> sudo reboot`; poll `mc.enduru.ai/api/gateways/all` every 30s |
| 5 | Voice turn p50 first-audio <800ms (fast mode), measured over 20 turns | Browser DevTools network panel + `console.time` instrumentation |
| 6 | Voice turns do NOT appear in task dashboard | `SELECT count(*) FROM tasks WHERE source='voice_modal' AND created_at > now() - interval '1 hour'` → `0` |
| 7 | Deep-mode voice still works with tools | One turn invoking a tool ("check the weather", "read my email") — tool dispatched, result spoken |
| 8 | Zero `spawn_subprocess_agent unavailable` warnings fleetwide for 24h | `for h in <all hermes>; do ssh $h grep "spawn_subprocess_agent unavailable" /var/log/gateway.log; done` returns empty |
| 9 | All 8 hermes customers on v16.3 commit | Customer pin verification loop returns 8/8 at `d2072fb484+` |
| 10 | Anthropic attribution closed OR scheduled follow-up | Upstream closed + plugin deployed, OR calendar event recurring weekly + memory ref |
| 11 | Kaino OAuth providers green | Dokploy UI screenshot |
| 12 | Nightly Mac restart confirmed firing | LaunchDaemon log shows fire in last 24h on both Macs |
| 13 | All 6 unified dashboard views regression-passed against 4 gateway flavors | Manual test matrix in §3.7 — paste-able screenshots per cell |

---

## 6. Risk register

| Risk | Probability | Impact | Mitigation | Owner | Escalation trigger |
|---|---|---|---|---|---|
| vm-1 fix breaks mac-studio (shared plugin code) | Low | High | Test on vm-1 first; mac-studio stays untouched until vm-1 24h-soak clean | Drew | mac-studio status flips on Day 3 |
| Phase B realtime WS proxy has auth flaws | Medium | High | Mirror existing `/api/voice/transcribe` auth model; security review pre-ship | Drew | Any 401/403 from real users post-deploy |
| Customer rollout stuck on OAuth re-expiry | Medium | Medium | Pre-refresh OAuth token before bumping any pin | Drew | Token expires within 72h |
| Voice latency anti-metric breached during Phase A | Low | Medium | Measure baseline pre-deploy; benchmark in staging before prod | Drew | Phase A p50 >4500ms in staging |
| Subprocess optimization introduces session-state bleed across voice turns | Medium | High | Phase A keeps subprocess-per-turn; only Phase B's realtime path is long-lived (with explicit session isolation) | Drew | Cross-turn context leak observed |

---

## 7. Dependencies graph

```
[Day 1: Phase 1 confirmation + sub-agent fan-out planned]
    │
    ├──→ [Gap #1: vm-1 mc-manifest investigation] ──→ [Fix + 24h soak]
    │
    ├──→ [Gap #4 Phase A: /api/voice/run] ──→ [Dashboard filter] ──→ [Measure p50]
    │           │
    │           └──→ [Gap #4 Phase B: /api/voice/realtime WS proxy] ──→ [Measure p50]
    │
    ├──→ [Gap #3: customer rollout verify] (parallel, sub-agent)
    │
    ├──→ [Gap #5: OAuth refresh] (parallel, Drew-only)
    │
    └──→ [Gap #6/#7: nightly restart + regression sweep] (parallel, sub-agent)
                    │
                    └──→ [Day 14: closure memory + verification matrix all-green]
```

---

## 8. Stakeholder map

| Stakeholder | Role | Notify before | Approve | Channel |
|---|---|---|---|---|
| Drew (self) | Owner | N/A | N/A | N/A |
| Hermes customer fleet | Affected (during rollout) | v16.3 customer roll | No | None (no customer-visible change expected) |
| Future-self / future-agent | Inheritor of memory file | Goal close | No | Memory file |

---

## 9. Telemetry plan

| Metric | Source | Store | Dashboard | Alert |
|---|---|---|---|---|
| Voice turn p50 first-audio | client (RUM via `console.time`) | (not currently aggregated; ad-hoc measurement) | N/A | >1500ms p50 over 20 turns = anti-metric breach |
| Task dispatch success rate | MC API logs | Postgres tasks table | MC dashboard | <99% over 1h = page Drew |
| Gateway last_seen drift | MC `/api/gateways/all` | Postgres gateways table | MC dashboard | last_seen >120s for >5min = red dot in UI |
| `spawn_subprocess_agent unavailable` warning count | hermes gateway log | (none — log grep only) | N/A | Any occurrence in 24h = page |

---

## 10. Operational guardrails

### 10.1 Constraints

1. **No skip-hooks ever** (`--no-verify`, `--no-gpg-sign`). Established by 2025-11-12 incident; see [[feedback_no_skip_hooks]].
2. **No destructive git on shared branches** without explicit Drew confirm.
3. **No destructive infra ops** (DB drops, container removes, Tailscale node deletes) without explicit confirm.
4. **Respect Dokploy compose env-wins rule** — update env in postgres BEFORE pushing; see [[reference_mc_nextpublic_flag_flip]].
5. **Verify after every deploy/restart** via `infra-verify` sub-agent; never close from log-absence alone.
6. **Honor merge-freezes** and check OAuth token state before redeploy; see [[reference_dokploy_gitlab_providers]].
7. **Don't touch openclaw sessions** — never `sessions cleanup --enforce` on a healthy gateway; see [[feedback_dont_prune_openclaw_sessions]].
8. **Don't `--no-cache` rebuild the customer fleet carelessly** — ~8min × 8 customers = wasted hour.
9. **Don't bypass openclaw plugin configSchema** — additionalProperties:false or crash-loop; see [[feedback_openclaw_plugin_config_schema]].
10. **Don't use HOSTNAME as bind address** in containerized Node servers; see [[feedback_docker_hostname_env]].

### 10.2 Trap catalog

1. **`spawn_subprocess_agent` was missing from v16.0–v16.2.** v16.3 (`d2072fb484`) restored it. If warning appears in container, container is not on v16.3.
2. **Mac LaunchDaemon "Input/output error 5"** — bootstrap races bootout; fix is `sleep 4; retry once` per `134666e`.
3. **Tailscale on macOS has 3 install paths.** Only the official .pkg from pkgs.tailscale.com gives System Extension + TUN + MagicDNS. Brew formula is userspace dead-end. See [[reference_mac_openclaw_headless_boot]].
4. **macOS Tailscale state lives at `/Library/Tailscale/tailscaled.state`** — NOT `/var/lib/tailscale`.
5. **Sticky -N hostname suffix** in Tailscale admin — orphan nodes hold the bare name. Delete old nodes first, then edit with auto-generate OFF.
6. **`fs.inotify.max_user_instances=128` silent killer.** Ubuntu default; bumped to 8192 on ubuntu-root + dokploy-root. See [[feedback_fleet_inotify_limit]].
7. **Runtime patches vanish on openclaw-setup re-run / volume restore / image rebuild.** Three durability tiers in [[feedback_runtime_patches_lost_on_restore]].
8. **`GatewayManager` cache is permanent** — DB url/token/kind changes need container restart, not SIGHUP. See [[reference_openclaw_mc_manifest_plugin]].
9. **Dokploy compose `env` always wins over docker-compose.deploy.yml `:-` defaults** — update DB first, then push.
10. **OpenClaw logs flush in bursts** — trust the DB (tasks table, gateways.last_seen_at) over log tails.
11. **Voice modal `source:"voice_modal"` marker exists in DB but dashboard doesn't filter** — the bug itself.
12. **`HOSTNAME` env in containers = container id** — never bind to it; see [[feedback_docker_hostname_env]].
13. **macOS Tailscale `.app` CLI** at `/Applications/Tailscale.app/Contents/MacOS/Tailscale` is the bundle-aware one. Direct symlink fails with "bundleIdentifier unknown."

### 10.3 Anti-goals

- We are NOT trying to add a new dashboard view; the unified views are the endpoint, not a stepping stone to "MC v2".
- We are NOT trying to rewrite hermes voice realtime; it's been working for Discord/Meet for 6 months. Resurrection means proxying it through MC, not refactoring it.
- We are NOT trying to fix openclaw's plugin reload loop upstream in this goal — if H1/H2 from gap #1 lands as cause, file an upstream issue and apply our workaround.
- We are NOT trying to unify Mac and Linux openclaw deploy automation in this goal — Macs are ad-hoc by necessity (System Extension prompts).

### 10.4 Decision log

- **2026-05-24 (Drew):** Voice modal P3.PR2 stays half-duplex on first ship; full-duplex realtime is Phase B. *Reason: half-duplex unblocks dashboard pollution fix today; full-duplex needs realtime backend resurrection.*
- **2026-05-24 (Drew):** Mac boot-headless uses official Tailscale .pkg + System Extension, not brew. *Reason: brew is userspace-only; no TUN, no MagicDNS injection.*
- **2026-05-25 (Drew):** v16.3 is canonical final supersedes v16/v16.1/v16.2. *Reason: spawn_subprocess_agent restoration is load-bearing for voice + valiant-* passive profiles.*
- **2026-05-25 (Drew):** Phase B realtime resurrection is in this goal, NOT split into a follow-up. *Reason: latency is the user-visible win; without Phase B the goal is half-done.*

---

## 11. Execution playbook

### 11.1 Priority + sequencing

1. **P0 — Gap #1** (turkules investigation). Blocks everything else; pure investigation + low-risk fix. Day 1–3.
2. **P0 — Gap #4 Phase A** (kill task pollution). High user-value, self-contained, parallel to #1. Day 1–5.
3. **P0 — Gap #3** (v16.3 customer rollout verification). Verification-only; fan out by sub-agent. Day 2.
4. **P1 — Gap #4 Phase B** (realtime resurrection). Needs Phase A landed first. Day 5–8.
5. **P2 — Gap #5/#6/#7** (OAuth, nightly restart, regression sweep). Background, parallel, sub-agent. Day 1–14.
6. **P2 — Gap #2** (Anthropic attribution). Calendar-tracked only; no active work this goal.

### 11.2 Sub-agent delegation map

| Work | Sub-agent | Mode |
|---|---|---|
| Gap #1 investigation (log grep, fs_usage, defaults read) | `Explore` | Parallel x3 (one per hypothesis) |
| Gap #3 v16.3 verification per customer | `infra-verify` | Parallel x8 (one per customer) |
| Gap #4 Phase A code | self | Serial |
| Gap #4 Phase B realtime WS proxy | `Plan` (architecture review) + self (implement) | Serial |
| Gap #6 nightly restart verify | `infra-verify` | Parallel x2 (one per Mac) |
| Gap #7 regression sweep | self + screenshot capture | Serial across 24 cells (6 views × 4 flavors) |

### 11.3 Escalation triggers

Escalate to Drew if:
- Gap #1 root cause requires patching openclaw core.
- v16.3 rollout fails on any customer (not just OAuth-expired).
- Phase A measurement shows realistic p50 >4500ms after subprocess optimization.
- Phase B realtime WS proxy hits security review concerns.
- Any anti-metric (§4.5) breaches its ceiling.
- Engineering cost exceeds 5 days for any single P0 gap.

Proceed without ping when:
- Any verification step returns expected output.
- Any rollback succeeds cleanly.
- Sub-agent fan-out completes within expected timeframe.

### 11.4 Working agreements

1. Plan-mode-first for any infra change (SSH commands, Dokploy redeploys, Mac LaunchDaemon ops).
2. Parallelize verification work via sub-agents; serialize implementation.
3. Update memory ONLY with stable learnings — not session noise. Use `[[name]]`-linked files.
4. Mark tasks done only with paste-able evidence. Never from log absence.
5. Don't drift into Phase C voice identity work (out of scope).
6. Don't add backwards-compat shims when removing task-creation from voice modal.
7. If turkules investigation reveals an openclaw upstream bug, file an issue in `moltbot-infra`; don't patch openclaw core.
8. Run `RUBRIC.md` on this goal weekly during execution; if 3+ checks degrade, re-scope.

### 11.5 Communication plan

| Result | Channel | Format |
|---|---|---|
| Gap closed | Memory file at `<memory_root>/project_mc_<gap>_closed.md` | One entry per gap; linked from MEMORY.md |
| Goal closed | Closure memory + DM to Drew | Link to verification matrix all-green + receipts |
| Rollback executed | Memory file at `<memory_root>/incident_<gap>_<date>.md` | Post-mortem within 24h |
| Customer-affecting issue | Slack #cs-eng | Pre-deploy heads-up + post-resolution summary |

---

## 12. Closure

### 12.1 Definition of done

Goal closes when all 13 verification matrix rows are `true` with paste-able evidence in this session's transcript or in the closure memory file. The closure artifact is `<memory_root>/project_mc_unification_closed.md` containing: the matrix with evidence per row, the final receipts table updated to show shipped %, and a learning summary capturing what we'd do differently.

### 12.2 Definition of NOT done — abandon triggers

- Gap #1 root cause requires forking openclaw core → abandon, file upstream issue, document the workaround as long-term.
- Phase A measurement shows realistic p50 >4500ms even after subprocess optimization → abandon Phase A, escalate to Phase B as the primary path, accept dashboard pollution fix without latency win in interim.
- Engineering cost exceeds 5 days for ANY P0 gap → re-scope, not push.
- An anti-metric breaches its ceiling for >24h → abandon current work, focus on remediation; resume only after the anti-metric returns to baseline.

### 12.3 Documentation deliverable

- Closure memory file at `<memory_root>/project_mc_unification_closed.md` (location named above).
- Per-gap memory file (one for any gap whose closure surfaced a new learning).
- Update to MEMORY.md index pointing at the closure file.
- One PR per code-change gap (Phase A endpoint, Phase B endpoint, dashboard filter).

### 12.4 Pointers for fast onboarding

- Architecture: [[reference_mc_gateway_registry]], [[reference_openclaw_gateways_topology]], [[reference_hermes_manifest_registry]], [[reference_mc_hermes_dispatch_path]], [[reference_openclaw_task_routing]]
- Voice realtime: `hermes-agent-enduru/gateway/voice_realtime/browser_bridge.py` lines 1-50; [[reference_amalia_voice_surface_recipe]]
- Mac boot-headless: [[reference_mac_openclaw_headless_boot]] (full recipe + 8 traps from 2026-05-24 recovery)
- Don't re-derive; these are load-bearing memory.

---

## 13. Sign-off

### 13.1 Three real-branch scoping questions

1. **Phase B scope** — bundle realtime resurrection in this goal (current state of TEMPLATE) or split into a follow-up to ship Phase A faster?
2. **Side-quest inclusion** — gaps #5/#6/#7 in this goal (current state) or kick to a separate "fleet hygiene" sweep?
3. **Target close** — accept the 14-day close (2026-06-08) or pull in to 7 days by dropping gap #7 (regression sweep) and accepting eventual-consistency on dashboard?
