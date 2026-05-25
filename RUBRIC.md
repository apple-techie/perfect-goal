# The Perfect Goal Quality Rubric

40 checks. Walk every one before delivering. If 3+ fail, the prompt isn't ready — tighten and re-run. Mark each as pass / fail / N/A (only for conditional sections in `GOAL-TYPES.md`).

The rubric is the difference between a goal that *looks* finished and a goal that *is* finished. Every check exists because a real prompt failed without it.

---

## §1 — Strategic anchor (4 checks)

| # | Check | Pass = | Failure mode this catches |
|---|---|---|---|
| 1 | North Star is **one sentence** | Single sentence, no list, no paragraph | The "shopping list" goal — multiple outcomes bundled |
| 2 | 5 Whys traces to a non-technical bottom layer | Layer 5 is a business/personal-velocity constraint | The "tech for tech's sake" goal — no real motivation |
| 3 | Counter-position is steel-manned | Strongest possible "don't do this" argument is written + addressed | The "echo chamber" goal — no opposition considered |
| 4 | Why-now has receipts | Specific event/SHA/incident dated within last 30 days | The "evergreen" goal — could have been filed any time, will be filed never |

## §2 — Ground truth (4 checks)

| # | Check | Pass = | Failure mode |
|---|---|---|---|
| 5 | Every entity has its identifier | Hostnames, ports, paths, IDs all present | The "the service" goal — vague entities propagate ambiguity |
| 6 | Receipts table has paste-able verification per row | Shell command + expected output, not "check the dashboard" | The "trust me" goal — claims without proof |
| 7 | X% is calibrated honestly | Reflects actual ship-vs-open ratio | The "we're 99% done" goal — invariably 60% in reality |
| 8 | Recent evidence quoted verbatim | Log lines + dashboard state copy-pasted, not paraphrased | The "telephone game" goal — misremembered signals |

## §3 — Gap decomposition (7 checks)

| # | Check | Pass = | Failure mode |
|---|---|---|---|
| 9 | Every gap has verbatim observed signal | Quoted log/error/screenshot, no paraphrasing | The "I think it's broken" gap — no characterization |
| 10 | Every gap has H1/H2/H3 hypothesis tree | Numbered, each falsifiable, best guess first | The "shotgun" gap — no causal model |
| 11 | Every gap has pre-staged shell investigation | Paste-ready commands, no placeholders | The "go figure it out" gap — investigation burden left to agent |
| 12 | Fix paths are cost-ordered (cheapest first) | Each labeled with effort + risk | The "surgical first" gap — defaults to expensive fixes |
| 13 | Every fix has a rollback procedure | Specific commands, not "revert" | The "no backup plan" gap — first failure becomes catastrophe |
| 14 | "Reproduces also on" line is filled | What else shows this signal OR "unknown — needs probe" | The "one-of" gap — misses generality |
| 15 | Success metric has measurable threshold | Number + unit (ms, %, count) | The "make it better" gap — done = vibes |

## §4 — Success metrics (8 checks — the multi-axis discipline)

| # | Check | Pass = | Failure mode |
|---|---|---|---|
| 16 | Outcome metrics defined with thresholds | User-facing, measurable, has a number | The "single-axis" goal — only one kind of success |
| 17 | Output metrics define the shipping artifacts | Each artifact has location + owner | The "intangible" goal — nothing concrete ships |
| 18 | Leading indicators identified | At least 1 pre-validation signal | The "wait for prod" goal — no early course-correction |
| 19 | Lagging indicators identified | At least 1 post-ship validation (24h+) | The "ship-and-forget" goal — no retrospective proof |
| 20 | Anti-metrics with hard ceilings | At least 1 metric that must NOT spike | The "goal-met-broke-everything-else" failure mode |
| 21 | Cost budget covers hours + $ + opportunity | All three axes filled | The "any cost" goal — runs forever |
| 22 | Quality gates per artifact | Tests / review / perf / docs each named | The "ship to ship" goal — quality is downstream regret |
| 23 | Time-boxed checkpoints exist | Day-N milestones, each with deliverable + check-in | The "deadline = vibes" goal — slips invisibly |

## §5 — Verification matrix (3 checks)

| # | Check | Pass = | Failure mode |
|---|---|---|---|
| 24 | 8–15 rows | Within range | <8 = under-specified; >15 = goal too big, should split |
| 25 | Every row's verification is paste-able | Shell command or specific UI state | The "verify it works" row — done = vibes |
| 26 | Every row maps to a success metric in §4 | Each verification proves a metric | The "performative" matrix — rows that don't prove anything |

## §6 — Risk register (conditional: migration / infra / feature) (3 checks)

| # | Check | Pass = | Failure mode |
|---|---|---|---|
| 27 | Each risk has probability + impact | Both fields populated | The "everything's a risk" register — no prioritization |
| 28 | Each risk has named mitigation | Concrete preventive step | The "fingers crossed" register |
| 29 | Each risk has escalation trigger | Specific signal that promotes to active issue | The "hope it doesn't fire" register |

## §7 — Dependencies + stakeholders + telemetry (conditional) (3 checks)

| # | Check | Pass = | Failure mode |
|---|---|---|---|
| 30 | Dependencies graph identifies parallel vs serial | At least one parallel branch OR justified single-thread | The "false serialization" goal — wasted calendar time |
| 31 | Stakeholders have comms channel + cadence | Each row has channel + check-in frequency | The "surprise" goal — affected parties learn at deploy |
| 32 | Telemetry has alert thresholds | Each metric has alert criterion | The "dashboard exists" goal — no one watches it |

## §8 — Operational guardrails (4 checks)

| # | Check | Pass = | Failure mode |
|---|---|---|---|
| 33 | Constraints reference establishing memory/incident | Each constraint links to source | The "abstract rule" constraint — agent ignores |
| 34 | ≥5 traps for any fleet-touching goal | Trap catalog is dense | The "agent re-discovers traps" failure mode |
| 35 | Anti-goals make scope crisp | What we explicitly avoid is listed | The "scope creep" goal |
| 36 | Decision log captures pre-decided calls | Decisions agent shouldn't re-litigate are listed | The "decision drift" goal |

## §9 — Execution playbook (4 checks)

| # | Check | Pass = | Failure mode |
|---|---|---|---|
| 37 | Priority + sequencing is explicit | Each gap has P0/P1/P2 + order | The "pick any" goal — agent picks wrong order |
| 38 | Sub-agent delegation map names types | Specific agent types (Explore / infra-verify / etc.) | The "do it all yourself" goal — no parallelization |
| 39 | Escalation triggers are specific | "Escalate if X" with concrete X | The "use judgment" goal — agent over- or under-escalates |
| 40 | Communication plan maps each result to a channel | Per-result row | The "result died in the agent context" failure |

## §10 — Closure + sign-off (4 checks)

| # | Check | Pass = | Failure mode |
|---|---|---|---|
| 41 | Definition of done references the matrix + closure artifact | Matrix-true + artifact-written | The "I'll know it when I see it" goal |
| 42 | Definition of NOT done has specific abandon triggers | Concrete triggers, not vibes | The "eternal" goal |
| 43 | Documentation deliverable has format + location + owner | All three named | The "lost knowledge" goal — learning evaporates |
| 44 | Three closing scoping questions are real branches | Each one would change the deliverable shape | The "fake question" close — "does this look good?" |

---

## How to use the rubric

### Quick run (5 min)

Walk all 44 checks. Mark each `pass` / `fail` / `N/A`. If 3+ fail, tighten and re-run.

### Deep run (15–20 min, for high-stakes goals)

For each check, write the *specific* evidence proving pass. E.g. for check #5 (every entity has identifier), enumerate the entities + their IDs. For check #15 (success metric threshold), state the number + unit. Deep runs catch checks that pass superficially but fail on inspection.

### Tracked run (for teams)

In a shared doc, table format: row per check, columns for `Pass/Fail/N/A | Evidence | Notes`. Reviewer signs the doc when 0 fails. The signature is the gate to filing the goal.

---

## What 3+ failures means

If 3+ rubric checks fail:

1. **Stop.** Do not deliver the prompt.
2. **Diagnose.** Are the failures in one cluster (e.g. all in §4 success metrics)? Or scattered? Cluster failures = a phase of work was skipped; scattered failures = the prompt was rushed.
3. **Tighten.** Address each failed check by re-investigating or re-writing.
4. **Re-run** the full rubric. Repeat until <3 failures.

A prompt that ships with 3+ failures becomes the agent's problem. The point of the rubric is to keep it the author's problem until it's actually ready.

---

## When to skip a rubric check (N/A)

The only valid N/A is when `GOAL-TYPES.md` marks the section as conditional and your goal's type doesn't require it. Examples:

- A **bug-fix** goal can mark §6 (Risk register), §7 dependencies, §8 stakeholders, §9 telemetry as N/A.
- A **research** goal can mark §5 (Verification matrix specifics) as N/A — but should add §13.1 with explicit research-question scoping.
- An **infra** goal must mark ALL of §6/§7/§9 as required — they're the highest-leverage sections for infra changes.

Marking a required check as N/A to make the rubric pass is a self-inflicted wound. Be honest.

---

## Rubric history (every check has a story)

Every rubric item exists because a real prompt failed without it. When proposing a new rubric item, include the failure mode + a real example. PRs to this rubric should follow the same discipline as the rest of the framework.

| # | Added | Triggering incident |
|---|---|---|
| 10 | 2026-05-25 | The MC vm-1 mc-manifest gap was initially filed as "vm-1 is red" with no hypothesis tree; agent ran in circles for 40 min before being given H1/H2/H3 |
| 15 | 2026-05-25 | The voice latency gap was filed as "make voice fast" — agent shipped a 5500ms p50 and considered it done |
| 20 | 2026-05-25 | A previous "speed up checkout" goal succeeded but spiked p99 — no anti-metric on tail latency |
| 24 | 2026-05-25 | A 22-row matrix turned out to be 4 goals duct-taped together; split saved 9 days |
| 44 | 2026-05-25 | Multiple goals closed with "does this look good?" → silent acceptance → late-stage scope changes |

When a new failure mode is identified in production, add it as a rubric item with the story. The rubric is meant to compound across teams.
