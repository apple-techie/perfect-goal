# The Perfect Goal Methodology

How to produce a Perfect Goal prompt that lets a coding agent execute with zero discretionary decisions left to make.

The methodology is three phases, executed in strict order. Skipping a phase produces a goal that looks complete but isn't — the agent will surface clarifying questions or silently make discretionary calls you'll disagree with.

---

## Phase 1 — Evidence-anchored synthesis

**Goal:** state the originating outcome in one sentence, with receipts.

**Non-negotiable:** no synthesis without commit-anchored evidence. Memory and framing both decay. Commits don't.

### Step 1.1 — Identify the involved repos

If the topic is given explicitly, the user names the repos. If the topic is "from recent history," auto-detect:

- cwd's repo (always)
- Sibling project dirs (search up 1–2 levels for `.git` directories)
- Memory file references (any `repo: <path>` or `repos: [...]` fields in MEMORY.md)

Produce a short repo list and confirm before pulling history.

### Step 1.2 — Pull recent history in parallel

```bash
for r in <repos>; do
  echo "=== $r ==="
  git -C $r log --oneline -<window>
done
```

Default window is 40. Increase to 80 for cross-cutting goals that span 2+ weeks.

### Step 1.3 — Cluster commits into themes

Read the commit messages. Group into 3–6 themes. Each theme:

- One-line description
- Anchor SHAs (5–15 commits per theme typical)
- A guess at status (shipped / halfway / open)

If you have more than 6 themes, the topic is too broad — narrow it or split the goal.

### Step 1.4 — State the originating outcome

Write **one sentence** naming what the user-visible goal of the recent work was. Inline the receipts.

> Example: "MC dashboard unification across openclaw + hermes gateways" — anchored by `3de1ba2` (Phase 0+1) → `c502661` (Phase 2 wrappers) → six `chore(dashboard): flip P2 unified-*-view live` commits.

### Step 1.5 — Confirm or cite implicit confirmation

Show the one-sentence read to the user. Wait for explicit confirmation OR cite implicit confirmation (e.g. "previous message says 'yes that's the goal'"). **Do not proceed to Phase 2 without a confirmation signal.** This is the single most common drift point in goal-setting.

### Common Phase 1 failure modes

| Failure mode | Symptom | Fix |
|---|---|---|
| Synthesized from user's framing instead of commits | Goal mentions outcomes that have no SHA receipts | Re-pull history; rewrite anchored to commits |
| Too many themes | 7+ clusters from 40 commits | Topic too broad; narrow or split |
| Themes overlap | Same SHA in 2+ themes | Re-cluster; pick the dominant theme per SHA |
| Skipped confirmation | Drove straight to Phase 2 | Stop. Confirm. Restart Phase 2 if scope shifts. |

---

## Phase 2 — Gap + state inventory

**Goal:** for every theme, honest accounting of what's shipped / halfway / open.

**Non-negotiable:** if a verification step hasn't been executed with paste-able output, it's open. No soft-pedaling.

### Step 2.1 — Walk each theme

For every theme from Phase 1:

1. **Shipped?** Find the closing commit + the verification evidence. If no evidence, downgrade to halfway.
2. **Halfway?** What's the open delta? File as a gap.
3. **Open?** Full decomposition (see Step 2.3).

### Step 2.2 — Inventory ground truth

Build the authoritative entity list:

- Every host with tailnet IP + LAN IP + alias
- Every container with image, ports, paths
- Every service with URL, auth mode, owner
- Every repo with path, canonical remote, branch
- Every secret store with vault + scope
- Every identifier (gateway IDs, persona names, profile slugs) the agent will see

**Tip:** if you find yourself writing "the X service" without an identifier, look up the identifier before continuing. Vague entities propagate ambiguity downstream.

### Step 2.3 — Decompose every open gap

Each gap needs **all seven** ingredients:

1. **Observed signal** — verbatim. Log lines, error text, screenshot description, dashboard state.
2. **Hypothesis tree** — H1/H2/H3 numbered. Best guess first. Each falsifiable.
3. **Pre-staged investigation** — verbatim shell commands. Paste-ready.
4. **Fix paths** — cheapest first. Each labeled by effort + risk.
5. **Rollback procedure** — specific commands that undo cleanly.
6. **Reproduces also on** — what else shows this signal, or "unknown — needs probe."
7. **Success metric** — measurable threshold with units.

If any ingredient is missing, **investigate before filing.** A gap with no observed signal isn't a gap; it's a hunch.

### Step 2.4 — Cross-reference memory

Every relevant `[[memory-name]]` from your MEMORY.md (or equivalent) gets inlined as a pointer in the appropriate section. Memory references go in:

- Constraints (when memory establishes a hard rule)
- Trap catalog (when memory documents a known gotcha)
- Pointers for fast onboarding (entry points)

If you have 100+ memory entries, scan only the relevant ones (greppable by topic or theme name).

### Step 2.5 — Explicit out-of-scope

List the side-quests that surfaced during investigation but are NOT part of this goal. This is a critical drift-prevention. If you don't cite out-of-scope items, the agent will scope-creep.

### Common Phase 2 failure modes

| Failure mode | Symptom | Fix |
|---|---|---|
| Optimistic shipped status | "It works in dev" → ship status | Demand paste-able prod verification before marking shipped |
| Missing hypothesis tree | Gap has description but no H1/H2/H3 | Generate hypotheses; the agent needs them |
| Vague success metric | "Make it fast" | Pin to a number with units |
| No rollback | "It'll be fine" | Every fix gets a rollback |
| No out-of-scope | Implicit scope | List it explicitly; saves a round-trip later |

---

## Phase 3 — 100× compression

**Goal:** fill the 13-section template. Run the 40-point rubric. Ship.

**Non-negotiable:** every section that's required (see `GOAL-TYPES.md`) must be filled. Empty required sections = goal not ready.

### Step 3.1 — Front-matter first

Fill the YAML front-matter:

- `goal_id`: short kebab-case, e.g. `mc-unification-2026-05`
- `owner`: who's accountable (often the requester)
- `opened_at`: today
- `target_close`: a date, not "TBD" — if you can't estimate, the goal is too big
- `status`: `open`
- `type`: pick from the taxonomy (see `GOAL-TYPES.md`)
- `tier`: A (quickest ship) / AB (ship + next phase) / ABC (long-term included)
- `scope`: tight (single thread) / wide (side-quests included)
- `priority`: P0 / P1 / P2
- `repos`: every repo the executing agent will touch
- `memory_root`: where MEMORY.md lives

### Step 3.2 — Fill each section in order

Order matters. Earlier sections inform later ones.

1. Strategic anchor first (north star + 5 whys + counter-position + why-now) — establishes the goal exists.
2. Ground truth second (inventory + receipts table) — establishes what reality is.
3. Gap decomposition third — establishes what's still open.
4. Success metrics fourth — establishes what "done" means measurably.
5. Verification matrix fifth — translates success metrics into commands.
6. Risk register / dependencies / stakeholders / telemetry (conditional by goal type) — establishes execution context.
7. Operational guardrails (constraints / traps / anti-goals / decision log) — establishes the rules.
8. Execution playbook (priority / delegation / escalation / agreements / comms) — establishes how it gets done.
9. Closure (DoD / NOT-done / docs / pointers) — establishes when it's over.
10. Sign-off (three scoping questions) — establishes the open branches.

### Step 3.3 — Run the rubric

Open `RUBRIC.md`. Walk every check. If 3+ items fail, tighten the produced prompt and re-run. Common rubric failures:

- A "shipped" claim with no SHA → fix by inlining the SHA.
- A gap with no hypothesis tree → fix by adding H1/H2/H3.
- A success metric without units → fix by pinning to a number.
- A constraint without memory ref → fix by linking to the established source.

### Step 3.4 — Close with three real scoping questions

End with three questions where each is a real branch in the goal. Test: would the deliverable shape change if the user answered differently? If no, the question isn't real — drop it and write a new one.

**Bad** (not real branches):
- "Does this look good?"
- "Should I proceed?"
- "Any feedback?"

**Good** (real branches):
- "Bundle Phase B in this goal or split into a follow-up?"
- "Include gaps #5/#6/#7 or kick to a separate hygiene sweep?"
- "Accept the 14-day target close or pull in to 7 days by dropping #7?"

### Common Phase 3 failure modes

| Failure mode | Symptom | Fix |
|---|---|---|
| Skipped a section "because it didn't apply" | Empty required section | Check `GOAL-TYPES.md`; if required, fill or re-scope |
| Filled a section with placeholder | "TBD" or "TODO" in a delivered prompt | These are forbidden in delivered prompts; resolve before shipping |
| Rubric run with vibes | "Looked fine to me" | Walk every check explicitly; mark pass/fail per item |
| Fake closing questions | "Does this look good?" | Rewrite as real branches in the goal |

---

## Iteration

Goals are living documents. Update as state changes.

**Update triggers:**

- A gap closes → move it from §3 (Gap decomposition) to §2.2 (Current state) with verification evidence.
- A new gap surfaces → add to §3 + adjust §11.1 (priority).
- An assumption proves wrong → log in §10.4 (Decision log) + update affected sections.
- Target close slips → update front-matter; document slip reason in §10.4.

**When to close:**

- All §5 (Verification matrix) rows are `true` with paste-able evidence.
- Closure artifact (§12.3) is written.
- Update status to `closed`. Move the goal file to an archive dir.

**When to abandon:**

- Any §12.2 (Definition of NOT done) trigger fires.
- Update status to `abandoned`. Write a post-mortem covering what was learned even though the goal didn't ship. The learning is the deliverable when the goal abandons.

---

## Anti-patterns to avoid

These are the failure modes that tank goal-prompts in the wild:

1. **The vibes goal.** "Make X better." Has no measurable outcome. Every Perfect Goal needs an outcome metric with a threshold.
2. **The everything goal.** "Refactor the entire backend." Too big. Split until each goal has 8–15 verification rows.
3. **The hidden assumptions goal.** "Migrate auth" without naming the user-set the migration affects, the rollback procedure, or the parallel-run period. Surface every assumption in front-matter or §10.4.
4. **The agent-driven goal.** "Have the agent figure out what to do." Defeats the purpose. The agent's job is execution; yours is decision.
5. **The no-rollback goal.** "We'll cross that bridge if we come to it." File the rollback procedure in §3.N.5 before starting. You'll thank yourself.
6. **The single-axis success goal.** Only outcome metrics, no anti-metrics. Anti-metrics catch the "succeeded the goal, broke unrelated things" failure mode. Fill §4.5.
7. **The eternal goal.** No target close, no abandon triggers. Set both in front-matter + §12.2.

---

## When NOT to use Perfect Goal

This framework is overkill for:

- **Trivial bugs** (single-line typo fix, obvious config tweak). Just fix it.
- **Pure research** with no execution endpoint. Use a research brief instead.
- **Exploratory prototyping** ("let's see what's possible"). Use a spike doc.
- **Conversations** ("what do you think about X?"). Use direct chat.

Use Perfect Goal when:

- The work spans multiple files / repos / surfaces.
- There are >1 stakeholders.
- Success is non-obvious to a fresh agent.
- The cost of getting it wrong is non-trivial (user impact, infra cost, time).
- You're going to hand it off to an agent (or future-you).

If 3+ of those apply, Perfect Goal pays for itself.
