# Goal Types — Adaptive Section Requirements

Not all goals are the same shape. A bug-fix needs hypothesis trees + crisp success metrics but probably not a stakeholder map. A migration needs a risk register + rollback per stage. An infra change needs telemetry + escalation triggers. A research goal might not have a verification matrix at all — its deliverable is knowledge.

The template's 13 sections fall into two buckets:

- **Core sections** — every goal has them.
- **Conditional sections** — required only for certain goal types.

This file maps goal type → required sections + tuning notes.

---

## Core sections (every goal, no exceptions)

| § | Section | Reason it's universal |
|---|---|---|
| 1 | Strategic anchor (north star + 5 whys + counter + why-now) | Without a one-sentence outcome, the agent has no compass |
| 2 | Ground truth (inventory + receipts table) | Without named entities, every claim is vague |
| 3 | Gap decomposition | Without gaps, there's nothing to execute |
| 4 | Success metrics (multi-axis) | Without measurable success, done = vibes |
| 5 | Verification matrix | Without paste-able verifications, the agent can't self-confirm |
| 10 | Operational guardrails (constraints + traps + anti-goals + decisions) | Without these, the agent makes discretionary calls you'll regret |
| 11 | Execution playbook | Without priority + delegation + escalation, the agent picks at random |
| 12 | Closure (DoD + NOT-done + docs + pointers) | Without these, the goal runs forever |
| 13 | Sign-off (three scoping questions) | Without explicit branches, drift starts at deploy |

## Conditional sections

| § | Section | Required for | Optional for | Skip for |
|---|---|---|---|---|
| 6 | Risk register | migration, infra, feature | refactor, unification | bug, research |
| 7 | Dependencies graph | migration, feature, infra, unification | refactor | bug, research |
| 8 | Stakeholder map | feature, migration, infra | unification | bug, refactor, research |
| 9 | Telemetry plan | feature, infra, migration | unification | bug, refactor, research |

---

## Goal type taxonomy

Seven canonical types. The skill auto-detects from the topic + flags but accepts an explicit override via `--type=<type>`.

### Type 1 — `bug`

**Definition:** isolated defect with a known symptom; outcome is symptom resolution.

**Required sections:** §§ 1, 2, 3 (typically 1 gap), 4 (outcome + anti-metric only), 5, 10, 11, 12, 13.

**Skip:** §§ 6 (risk register — bug fix has minimal risk surface), §7 (dependencies — usually self-contained), §8 (stakeholders — internal-only typically), §9 (telemetry — covered by existing observability).

**Tuning notes:**
- §3 hypothesis tree is the load-bearing artifact for a bug — go deep here.
- §4 success metric: bug closed when symptom no longer reproduces + verified absent in prod for 24h.
- §11 escalation trigger: "Escalate if root cause requires patching outside the affected module."

**Example:** `examples/bug-payment-webhook.md`

### Type 2 — `feature`

**Definition:** net-new user-visible capability.

**Required sections:** all 13. Especially §8 (stakeholders — features have customer impact) and §9 (telemetry — features need adoption + perf measurement post-ship).

**Tuning notes:**
- §1.2 5-Whys should bottom out in a customer/business outcome (revenue, retention, NPS).
- §4 anti-metrics: feature can't spike alert volume, can't degrade adjacent feature perf, can't increase customer support volume.
- §9 telemetry: pre-ship instrumentation is non-negotiable; you can't measure adoption you didn't instrument.
- §12.2 NOT-done triggers: e.g. "Abandon if adoption <X% after Y weeks" or "Abandon if anti-metric Z breaches ceiling."

**Example:** `examples/feature-voice-realtime.md`

### Type 3 — `migration`

**Definition:** moving a system, dataset, or workflow from one state to another with intent to retire the old state.

**Required sections:** all 13. §6 (risk register) and §7 (dependencies) are critical — migrations have unique risk surface (data loss, dual-write divergence, traffic-split errors).

**Tuning notes:**
- §3 every gap has a parallel-run period planned (old + new state coexisting).
- §3.N.5 rollback must include "drain new state back to old state" not just "stop new state."
- §6 risk register should cover: data loss, traffic split bugs, OAuth/auth state desync, customer-visible regression during parallel run.
- §7 dependencies: explicit sequencing of "deploy new", "dual-write enabled", "traffic shift to new", "old retired."
- §10.4 decision log: parallel-run duration is the canonical pre-decision (e.g. "2 weeks dual-write before traffic shift").

**Example:** `examples/stripe-billing-migration.md`

### Type 4 — `infra`

**Definition:** change to underlying infrastructure (servers, networks, deploys, CI/CD) that affects multiple downstream systems.

**Required sections:** all 13. §6, §9 are non-negotiable. §10.2 (trap catalog) typically has ≥10 entries for fleet-touching infra.

**Tuning notes:**
- §3 every gap has explicit blast-radius assessment ("affects N hosts / M services").
- §3.N.5 rollback must work even if the agent has lost SSH to the host (e.g. cron-driven safety reverts).
- §6 risk register's "impact" column should include downstream effects, not just direct.
- §9 telemetry: alert thresholds tighter than usual (infra incidents page humans).
- §11.3 escalation triggers default to lower thresholds (escalate earlier on infra).
- §11.4 working agreements: "plan-mode-first" mandatory for infra changes.

**Example:** the Mission Control / Mac boot-headless goal in `examples/mission-control-unification.md` is partly an infra goal.

### Type 5 — `research`

**Definition:** investigation with an unknown outcome; deliverable is knowledge, not running code.

**Required sections:** §§ 1, 2, 3 (the open questions), 4 (knowledge-outcome metrics: "we know whether X is true"), 10, 11, 12, 13.

**Skip:** §§ 5 (no boolean verification matrix typically), 6 (no risk register), 7 (often single-thread), 8 (often solo), 9 (no production telemetry yet).

**Replace §5 with:** a list of explicit research questions, each with: "yes-result implication" + "no-result implication" + "inconclusive-result implication." Forces commitment to a decision regardless of answer.

**Tuning notes:**
- §1 north star is "we know whether X is true with confidence Y" not "we built X."
- §3 hypotheses ARE the goal — depth here is paramount.
- §4 outcome: a decision document + recommendation, location + format named.
- §12.3 documentation deliverable: a research brief, not a deploy.
- §12.2 NOT-done trigger: "If after 2 weeks we still can't characterize the question, escalate or abandon."

### Type 6 — `refactor`

**Definition:** internal code change with no user-visible outcome; outcome is improved maintainability, perf, or developer velocity.

**Required sections:** §§ 1, 2, 3, 4, 5, 10, 11, 12, 13.

**Optional/skip:** §§ 6, 7, 8 (refactors are typically scoped to one team), 9 (no new telemetry).

**Tuning notes:**
- §1.3 counter-position is critical — "why not just leave the code alone?" must be addressed.
- §4 anti-metrics: refactor MUST NOT introduce user-visible regression. Anti-metrics dominate the metric mix.
- §4 outcome metrics: must be measurable (e.g. "compile time -50%", "test runtime -30%", "lines of code -X", "cyclomatic complexity -Y").
- §10.3 anti-goals: scope-creep into rewrites is the #1 refactor failure mode. Explicit anti-goal: "Not rewriting; only restructuring."

### Type 7 — `unification`

**Definition:** cross-cutting work to consolidate fragmented surfaces, tools, or workflows into a single coherent one.

**Required sections:** all 13. Unification goals are the most cross-cutting and usually largest — every conditional section becomes required.

**Tuning notes:**
- §1.1 north star almost always names "single X" — "single pane of glass," "single source of truth," "one workflow."
- §2.1 inventory is huge — every surface being unified gets an entry.
- §3 gaps come in clusters by surface; group them.
- §4 outcome metric usually involves measuring the *fragmentation reduction* (e.g. "from N surfaces to 1").
- §10.3 anti-goal: "Not adding a new surface that replaces the old surfaces — actually retiring the old."
- §11.1 priority: cleanup of old surfaces is often P2 — the user mostly cares about the new unified surface working. Don't drop P2 cleanups silently; track them.

**Example:** `examples/mission-control-unification.md` is the canonical unification example.

---

## Auto-detection heuristics (for the skill)

When `--type=auto` (default) the skill picks based on keywords + commit patterns:

| Topic keyword pattern | Type guess |
|---|---|
| "fix", "bug", "broken", "regression" | bug |
| "add", "build", "launch", "introduce" | feature |
| "migrate", "move", "consolidate to" | migration |
| "deploy", "infrastructure", "server", "CI", "monitoring" | infra |
| "investigate", "research", "characterize", "spike" | research |
| "refactor", "cleanup", "simplify", "DRY" | refactor |
| "unify", "consolidate", "single pane", "rationalize" | unification |

If two types both match, escalate to the user — ambiguity in type → ambiguity in required sections.

Commit-pattern fallback: if topic is ambiguous but commits skew toward a type (e.g. >50% commits are `fix:` prefixed), bias toward that type.

---

## Per-type rubric weighting

When running `RUBRIC.md`, certain checks are doubly-weighted per type. A 2-weight failure counts as 2 against the "3+ failures = re-run" gate.

| Type | Doubly-weighted checks |
|---|---|
| bug | #9 (verbatim signal), #10 (hypothesis tree), #15 (measurable success) |
| feature | #16 (outcome metric), #19 (lagging indicator), #20 (anti-metric), #32 (telemetry alert) |
| migration | #13 (rollback), #27/#28 (risk + mitigation), #36 (decision log) |
| infra | #13 (rollback), #28 (mitigation), #29 (escalation), #34 (≥5 traps) |
| research | #1 (one-sentence north star), #15 (replaced with research-question commit), #43 (doc deliverable) |
| refactor | #3 (counter-position), #20 (anti-metric), #35 (anti-goals) |
| unification | #5 (entity IDs everywhere), #30 (parallel/serial deps), #41 (DoD references concrete closure) |

These weightings encode: the highest-leverage checks for that type. A bug missing a hypothesis tree is worse than a bug missing a stakeholder map.

---

## When a goal spans types (multi-type goals)

Sometimes a goal is genuinely multi-type — e.g. an infra change with a feature on top, or a migration that includes a refactor along the way.

**Rule:** treat as the *more demanding* type. Required sections are the union; tuning notes from both types apply; rubric weighting takes the higher weight per check.

If the goal spans 3+ types, split it. The cognitive overhead of holding 3 types in the agent's head exceeds the value of bundling.
