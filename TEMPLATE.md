# The Perfect Goal Template

The output shape of every Perfect Goal prompt. 13 sections, ~40 subsections, every slot load-bearing. Fill every required slot before filing the goal. If a slot can't be filled, the goal isn't ready — return to Phase 2 (gap inventory) until it can be.

Required vs conditional sections by goal type are defined in `GOAL-TYPES.md`.

---

```yaml
---
goal_id: <short-kebab-case-id>          # e.g. mc-unification-2026-05
owner: <human>                           # who is accountable
opened_at: <YYYY-MM-DD>
target_close: <YYYY-MM-DD>               # not optional; if you can't estimate, the goal is too big
status: open                             # open | in-progress | blocked | closed | abandoned
type: <bug|feature|migration|infra|research|refactor|unification>
tier: <A|AB|ABC>                         # A = quickest ship; AB = ship + next phase; ABC = long-term included
scope: <tight|wide>                      # tight = single thread; wide = side-quests included
priority: <P0|P1|P2>                     # P0 = blocker; P1 = important; P2 = nice-to-have
repos: [<repo-path>, ...]                # every repo the executing agent will touch
memory_root: <path>                      # where MEMORY.md (or equivalent) lives
---
```

---

# `# /goal — <topic>, <YYYY-MM-DD>`

---

## 1. Strategic anchor

### 1.1 North Star (one sentence)

A single sentence naming the user-visible outcome. Not a list. Not a paragraph. If it takes more than one sentence, the goal is too big — split it or pick the headline.

> Example: "Mission Control is the single pane of glass over my entire compute fleet — every gateway in one truthful list, every task dispatchable end-to-end with rendered diffs, every voice turn sub-second without polluting the dashboard, and every host self-healing through cold reboots."

### 1.2 The 5 Whys (root motivation traced 5 levels deep)

Trace the goal's motivation down 5 layers so the executing agent understands *why*, not just *what*. The deepest "why" is usually a business or personal-velocity constraint, not a technical one.

> Example:
> 1. **Why migrate auth?** JWT validation adds 80ms p50 to every request.
> 2. **Why does 80ms matter?** It pushes our checkout page TTFB above the 200ms threshold where conversion drops measurably.
> 3. **Why does conversion matter at this scale?** We're 4 months from Series A; conversion is the headline KPI in the deck.
> 4. **Why is the deck the priority?** Our runway needs the raise to land at terms that don't dilute the team.
> 5. **Why is dilution the constraint?** Founders below 40% combined post-A historically get pushed out by board dynamics within 18 months.

### 1.3 Counter-position (steel-man the argument against)

Write the strongest possible argument *against* doing this goal. Then address it. If you can't steel-man an opposition, you haven't thought hard enough about the goal — or it's not worth doing.

> Example: "JWT is industry standard and works at 10× our scale. The 80ms isn't user-perceptible. Migration risks 3 weeks of engineering time and an outage class we've never debugged. **Counter:** 80ms IS measurable in our conversion funnel (see analytics ticket #4421); the 3 weeks is conservatively budgeted with a feature-flagged parallel-run period; the outage class is documented in our infra runbook and the rollback is one config flip."

### 1.4 Why this matters NOW (timing receipts)

One paragraph (≤120 words). Must include the originating event/incident, the cost of leaving the gap, why the timing is now. Anchored to recent receipts — SHAs, dates, log lines, dashboard states.

> Example: "The 2026-05-20 upstream merge silently dropped 4 fork customizations, causing fleet-wide task-dispatch outage masked by the unified-dashboard work. v16.3 restored execution (`d2072fb484`) but 7 gaps remain. We're a week from the Stripe usage-billing cutover (2026-06-01) which depends on MC showing accurate spend per gateway — and that depends on every gateway being green and dispatching tasks. Each day of drift = one less day to debug billing edge cases pre-cutover."

---

## 2. Ground truth

### 2.1 Authoritative inventory (named entities, ports, paths, IDs)

Every entity the executing agent will touch, with its identifier. Rule of thumb: if the agent would need to `grep` for an ID or path, it goes here.

Include:

- **Hosts** with tailnet IP + LAN IP + hostname alias
- **Containers** with image, host path, ports, env-source
- **Services** with URL, auth mode, owner
- **Repos** with path, canonical remote, branch
- **Secrets stores** with vault name + scope
- **Identifiers** users will see (gateway IDs, persona names, profile slugs)

> Example: see `examples/mission-control-unification.md` for a fleet-scale inventory.

### 2.2 Current state (~X% — receipts table)

Markdown table, 4 columns. One row per theme from Phase 1 synthesis. Be honest with the X% — agents calibrate effort to it.

| Workstream | Status | Key commits / artifacts | Verification |
|---|---|---|---|
| <theme> | <shipped\|halfway\|open> | <SHAs or file refs> | <paste-able command + expected output> |

### 2.3 Recent evidence anchor

The last 5–10 commits or events that motivated this goal, with one-line context per. Quotes log lines, screenshots, dashboard states verbatim when relevant.

---

## 3. Gap decomposition

One subsection per open gap. Each gap is a self-contained mini-charter the executing agent can hand to a sub-agent.

### 3.N — `<Gap N name>`

#### 3.N.1 Observed signal (verbatim)

Log lines, error text, dashboard state, screenshot description. **NO paraphrasing.** If you don't have a verbatim signal, you haven't characterized the gap — investigate before filing.

#### 3.N.2 Hypothesis tree

Numbered H1/H2/H3/… each with one-line rationale. Best guess first. Each hypothesis is a falsifiable claim.

> Example:
> - **H1:** openclaw config file watcher fires on a touched file → plugin reload kills the heartbeat closure. (most likely; matches log timing)
> - **H2:** sparkle auto-updater check at +2min boundary triggers a `relaunch` codepath. (plausible; matches the 2-min cadence)
> - **H3:** another plugin's `onChange` config emit cascades into a gateway `plugins.reload()`. (worth checking; would also explain the symptom)

#### 3.N.3 Pre-staged investigation

Verbatim shell commands the agent runs to narrow the hypothesis space. Paste-ready, no placeholders.

```bash
ssh vm-1 'grep -E "loading|restart|update|signal|sparkle|relaunch|reload" ~/Library/Logs/openclaw/gateway.log | tail -60'
```

#### 3.N.4 Fix paths (in cost order)

Cheapest first. Each labeled by effort + risk.

1. **Cheapest (15 min, low risk)** — disable sparkle auto-updater. Confirms H2 if reloads stop.
2. **Medium (2 hr, medium risk)** — patch mc-manifest to re-arm heartbeat on `pluginsReady` lifecycle event.
3. **Surgical (1 day, high risk)** — root-cause the openclaw plugin reload loop upstream.

#### 3.N.5 Rollback procedure

What undoes the fix cleanly if it makes things worse. Specific commands, not "revert."

> Example: "Re-enable sparkle via `defaults write ai.openclaw.gateway SUEnableAutomaticChecks -bool true` + `sudo launchctl kickstart -k system/ai.openclaw.gateway`."

#### 3.N.6 Reproduces also on

What other surfaces show the same signal, or "unknown — needs probe." Forces the agent to think about generality.

#### 3.N.7 Success metric

A measurable threshold. Not "fast" — `<800ms p50`. Not "stable" — `>99.5% uptime over 24h`. Not "clean" — `0 warnings in fleet log for 24h`.

---

## 4. Success metrics (the multi-axis framework)

The single most-skipped section in typical goal prompts. The Perfect Goal template treats success as multi-dimensional. Fill every axis.

### 4.1 Outcome metrics — what success means for the end user

User-facing, observable. Examples: latency p50/p95, error rate, conversion rate, page load time, completion rate. State the threshold AND how it's measured.

### 4.2 Output metrics — what artifacts ship

What concrete things exist that didn't before. Examples: a deployed service, a merged PR, a new dashboard, a memory file, a runbook. Each artifact has a location + owner.

### 4.3 Leading indicators — early signals (hours to days)

Pre-validation signals that say "we're on track." Examples: PR merged, CI green, test coverage threshold met, staging health green. These predict but don't prove the outcome.

### 4.4 Lagging indicators — true validation (24h+ post-ship)

The signals that retrospectively prove the goal landed. Examples: production error rate steady 24h+ post-deploy, customer support volume unchanged, business KPI moved. These confirm but happen too late to course-correct.

### 4.5 Anti-metrics — what we MUST NOT spike

The metrics that, if they regress, the goal failed regardless of the success metrics. Examples: total error rate, p99 latency, cloud cost, alert volume. Each anti-metric has a hard ceiling.

### 4.6 Cost budget

What this goal is allowed to spend. Track all three:

- **Engineering hours**: estimated total + cap before re-scoping.
- **Dollars**: cloud cost delta, vendor cost, contractor cost.
- **Opportunity cost**: what you're NOT doing while this is in flight.

### 4.7 Quality gates

What each artifact must clear before it ships. Per-artifact: tests passing, code review complete, security review (if applicable), perf benchmarks met, docs updated, memory updated.

### 4.8 Time-boxed checkpoints

Day-N milestones. Each checkpoint has a deliverable + a check-in.

| Day | Deliverable | Check-in |
|---|---|---|
| 1 | Phase 1 synthesis complete + plan approved | Self |
| 3 | First gap closed with verification evidence | Self |
| 7 | All P0 gaps closed | Owner review |
| 14 | Goal closed OR re-scoped with explicit reason | Owner + stakeholders |

---

## 5. Verification matrix (boolean checklist)

Markdown table, 3 columns: **# | Criterion | How to verify**. Every row must be `true` with paste-able evidence before the goal closes. Aim for 8–15 rows; >15 = goal is too big and should be split.

| # | Criterion | How to verify |
|---|---|---|
| 1 | <criterion> | <paste-able shell, expected output, or specific dashboard state> |

---

## 6. Risk register

Table format. One row per risk above some threshold (low-impact + low-probability risks can be omitted).

| Risk | Probability | Impact | Mitigation | Owner | Trigger to escalate |
|---|---|---|---|---|---|
| Customer X's pin-bump hits OAuth expiry | Medium | High (deploy stuck) | Pre-refresh token before bump | <name> | Token expires <72h |

---

## 7. Dependencies graph

ASCII or mermaid showing what blocks what. Forces the agent to identify parallelizable vs sequential work.

```
[Phase 1: investigate vm-1] → [Gap #1 fix] ─┐
                                              ├→ [Verify all gateways green]
[Gap #3: customer rollout verification] ──── ┘
                                              ↓
                                       [Voice Phase A] → [Voice Phase B]
```

---

## 8. Stakeholder map

Who's affected, who needs to know, who approves. Communication cadence.

| Stakeholder | Role | Needs to know before | Needs to approve | Comms channel |
|---|---|---|---|---|
| Customer success | Affected | Cutover day | No | Slack #cs-eng |
| CTO | Owner | Plan + 1× check-in | Yes, on plan | DM |
| Security | Reviewer | PR open | Yes, on rollout | PR review |

---

## 9. Telemetry plan

How we observe in production. Each metric: where it's emitted, where it's stored, dashboard URL, alert thresholds.

| Metric | Source | Store | Dashboard | Alert |
|---|---|---|---|---|
| Voice turn p50 | client (RUM) | Datadog | <url> | >1500ms for 10min |
| Task dispatch success rate | MC API | Postgres | <url> | <99% over 1h |

---

## 10. Operational guardrails

### 10.1 Constraints — hard non-negotiables

Numbered list. Each constraint is one sentence + cross-reference to the memory/commit/runbook that established it. No vague rules — every constraint is testable.

> 1. Never `--no-verify` on a commit — established by 2025-11-12 incident where a skipped pre-commit shipped a secret. See `[[feedback_no_skip_hooks]]`.

### 10.2 Trap catalog — institutional knowledge

The things that will bite the agent if it doesn't know. Each trap: one sentence + memory ref. **≥5 traps for any fleet-touching goal.** This section compounds value across goals — when a trap fires once, it goes here, and the next goal inherits the immunity.

### 10.3 Anti-goals — what we explicitly avoid

The failure modes we'd rather close as `abandoned` than achieve. Forces scope clarity.

> Example: "We are NOT trying to ship a generic dashboard framework. If the unified-views work starts looking like a CMS, abandon."

### 10.4 Decision log — pre-recorded calls

Decisions you've already made that the agent shouldn't re-litigate. Each decision: what, why, when, by whom.

> Example: "Decision 2026-05-18 (Drew): voice-modal stays half-duplex on first ship; full-duplex is Phase B. Reason: half-duplex unblocks dashboard pollution fix today; full-duplex needs realtime backend resurrection."

---

## 11. Execution playbook

### 11.1 Priority + sequencing

P0/P1/P2 per gap, explicit ordering. Which gap blocks which.

> 1. **P0 — Gap #1** (turkules investigation). Blocks everything else because it's pure investigation + low-risk fix.
> 2. **P0 — Voice Phase A** (kill task pollution). High user-value, self-contained, can run parallel to #1.
> 3. **P1 — Gap #3** (v16.3 rollout verification). Verification-only, fan out by sub-agent.
> 4. **P1 — Voice Phase B** (realtime resurrection). Needs Phase A landed first.
> 5. **P2 — Gaps #5/#6/#7** (OAuth, nightly restart, regression sweep). Background, parallel.

### 11.2 Sub-agent delegation map

Who does what. What's parallelizable. What's serial. Reference specific agent types if your environment has them (e.g. `Explore`, `infra-verify`, `Plan`).

### 11.3 Escalation triggers

When to ping the human owner vs proceed. Be specific.

> - Escalate if: gap #1 root cause requires patching openclaw core; v16.3 rollout fails on any customer; voice Phase A latency >4000ms p50 in measurement.
> - Proceed without ping: any verification step that returns expected output; any rollback that succeeds cleanly.

### 11.4 Working agreements

Process rules ≤10 items. Plan-mode-first for X. Always sub-agent for Y. Mark done only with evidence Z.

### 11.5 Communication plan

Where results land. Each artifact: PR description, memory file, slack post, dashboard update, runbook entry.

| Result | Channel | Format |
|---|---|---|
| Goal closed | DM to owner | Link to verification matrix + memory file |
| Gap closed | Memory file | One entry per gap, linked from MEMORY.md |
| Rollback executed | Slack #infra | Post-mortem within 24h |

---

## 12. Closure

### 12.1 Definition of done

One paragraph. References the verification matrix. Names the closure artifact (memory file, PR, dashboard state) that proves it.

> Example: "Goal closes when all 13 verification matrix rows are `true` with paste-able evidence in this session's transcript or in a follow-up memory file. The closure artifact is `~/.claude/projects/.../memory/project_mc_unification_closed.md` containing the matrix + final receipts + a learning summary."

### 12.2 Definition of NOT done — abandon triggers

What would cause us to close as `abandoned` instead of `done`. Specific triggers, not vibes.

> Example:
> - If gap #1 root cause turns out to require openclaw core fork → abandon and file an upstream issue.
> - If voice Phase A measurement shows realistic p50 >4000ms after subprocess optimization → abandon Phase A, escalate to Phase B as the primary path.
> - If engineering cost exceeds 5 days for P0 gaps → re-scope or abandon, not push.

### 12.3 Documentation deliverable

What gets written when the goal closes. Format + location + owner.

- Memory file at <path> capturing the receipts table + final verification + learnings.
- Runbook entry at <path> for any new operational procedure introduced.
- PR description in <repo> referencing this goal's ID.

### 12.4 Pointers for fast onboarding

The "if you read nothing else, read these" list. Memory cross-refs (`[[name]]` form) + key file paths the agent reads first.

---

## 13. Sign-off

### 13.1 Three scoping questions

End with three scoping questions for the user where each is a real branch in the goal — not "is this good?" but "do you want X scoped in or out?" Each branch changes the deliverable shape.

> Example:
> 1. **Phase B scope** — bundle realtime resurrection in this goal or split into a follow-up?
> 2. **Side-quest inclusion** — are gaps #5/#6/#7 in this goal or a separate "fleet hygiene" sweep?
> 3. **Time budget** — accept the 14-day target close or pull in to 7 days by dropping gap #7?

---

## Notes on filling the template

- **Skip nothing required.** If a slot is empty for your goal, the goal isn't ready to file — return to Phase 2.
- **Be honest with the X%.** Agents calibrate effort to it. 90% means the last 10% is hard.
- **Quote signals verbatim.** Paraphrasing log lines is how investigators end up chasing the wrong cause.
- **Cost-order fix paths.** Always cheapest first. Surgical is a last resort, not a default.
- **Use `[[memory-name]]` form for cross-refs.** Indexed, linkable, future-proof.
- **Real branches in closing questions.** "Is this good?" is not a real question. "Bundle or split?" is.
- **Adapt by goal type.** A bug-fix goal doesn't need a stakeholder map; an infra-migration goal does. See `GOAL-TYPES.md`.

After filling: run the rubric in `RUBRIC.md`. If 3+ items fail, tighten before delivering.
