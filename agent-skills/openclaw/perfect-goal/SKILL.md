---
name: perfect-goal
description: "Build a 100x-leverage goal prompt for a multi-step initiative — 13-section template, 44-point rubric, evidence-first synthesis. Use when authoring rollouts, migrations, infra changes, feature launches, refactors, or research investigations that will be handed off to another agent or future-self."
homepage: https://github.com/apple-techie/perfect-goal
license: MIT
user-invocable: true
---

# Perfect Goal

Produce goal prompts that let an executing agent run with zero discretionary calls left to make. Three-phase workflow + 13-section output + 44-point quality bar.

## When to invoke

- Multi-step initiative spanning 2+ files / surfaces / repos
- Cross-cutting work (multiple subsystems, multiple stakeholders)
- Anything you'll hand off to another agent or future-self
- Fleet rollout, migration, infra change, feature launch, refactor, research investigation, unification

## When NOT to invoke

- Single-line bug fix (just fix it)
- Pure conversation or quick lookup
- Exploratory spike with no commit endpoint

## Workflow (strict order, no phase skipping)

### Phase 1 — Evidence-anchored synthesis

1. Identify involved repos (cwd + sibling project dirs if cross-repo).
2. Pull recent commits in parallel: `for r in <repos>; do git -C $r log --oneline -40; done`.
3. Cluster commits into 3–6 themes anchored to SHAs.
4. State the originating outcome in **ONE sentence** with receipts inline.
5. Wait for user confirmation (or cite implicit confirmation) before Phase 2.

**Non-negotiable:** no synthesis without commit-anchored receipts. Memory and framing both decay; commits don't lie.

### Phase 2 — Gap + state inventory

For each theme: classify as shipped / halfway / open.

- **Shipped** → row in receipts table with SHA + verification command.
- **Halfway** → name the open delta.
- **Open** → full decomposition with ALL 7 ingredients:
  1. Observed signal (verbatim — log lines, error text, dashboard state)
  2. Hypothesis tree (H1/H2/H3 numbered, falsifiable, best guess first)
  3. Pre-staged investigation (paste-ready shell commands)
  4. Fix paths (cost-ordered: cheapest first, with effort + risk)
  5. Rollback procedure (specific commands, not "revert")
  6. Reproduces also on (other surfaces or "unknown — needs probe")
  7. Success metric (number + unit)

Cross-reference relevant memory via `[[memory-name]]` form. Explicitly list out-of-scope side-quests.

### Phase 3 — 100x compression

Fill the 13-section template (`references/TEMPLATE.md`). Validate against the 44-point rubric (`references/RUBRIC.md`). If 3+ rubric checks fail (counting type-weighted), tighten and re-run. Close with **three real-branch scoping questions**.

## Output shape — 13 sections in order

```
1. Front matter (goal_id, owner, opened_at, target_close, status, type,
                 tier, scope, priority, repos, memory_root)
2. Strategic anchor (north-star sentence + 5 Whys + counter-position + why-now)
3. Ground truth (authoritative inventory + receipts table + recent evidence)
4. Gap decomposition (one block per gap, 7 ingredients each)
5. Success metrics (outcome / output / leading / lagging / anti / cost /
                    quality gates / time-boxed checkpoints — 8 axes)
6. Verification matrix (8–15 boolean rows, paste-able commands)
7. Risk register                  (conditional by type)
8. Dependencies graph             (conditional)
9. Stakeholder map                (conditional)
10. Telemetry plan                (conditional)
11. Operational guardrails (constraints + trap catalog ≥5 + anti-goals + decision log)
12. Execution playbook (priority + delegation + escalation + agreements + comms)
13. Closure (DoD + NOT-done + docs deliverable + onboarding pointers + 3 scoping questions)
```

## Goal types — which sections are required

| Type | Skip | Tuning |
|---|---|---|
| bug | §6 §7 §8 §9 | Deep hypothesis tree; success = symptom absent in prod 24h |
| feature | none | Stakeholder map + telemetry non-negotiable |
| migration | none | Risk register + rollback per stage critical; parallel-run period in §10.4 |
| infra | none | ≥10 traps; tighter escalation thresholds; plan-mode-first |
| research | §5 §6 §7 §9 | Replace §5 with research questions + yes/no/inconclusive implications |
| refactor | §6 §7 §8 | Anti-metrics dominate; counter-position load-bearing |
| unification | none | All 13; fragmentation-reduction metric in §4 |

See `references/GOAL-TYPES.md` for the full adaptive matrix + per-type rubric weighting.

## Quality bar (mandatory before delivery)

Walk all 44 rubric checks in `references/RUBRIC.md`. Mark pass / fail / N/A per item (N/A only for conditional sections marked skip for the type). If 3+ fail, tighten and re-run.

Common pre-flight failures:

- North Star is more than one sentence → trim
- "Shipped" claim has no SHA receipt → inline it or downgrade to halfway
- Gap has no H1/H2/H3 hypothesis tree → add it
- Success metric has no unit → pin to a number
- Constraint without memory reference → link it
- "Reproduces also on" line empty → fill with concrete answer or "unknown — needs probe"
- Closing question is "does this look good?" → rewrite as a real branch

## Closing pattern — three real-branch scoping questions

Every produced goal ends with three questions where each answer changes the deliverable shape.

**Banned closings:**

- "Does this look good?"
- "Should I proceed?"
- "Any feedback?"
- "Let me know if you'd like changes."

**Valid:**

- "Bundle Phase B in this goal or split into a follow-up?"
- "Include side-quests #5/#6/#7 or kick to a separate hygiene sweep?"
- "Accept 14-day target close or pull in to 7 by dropping gap #7?"

If your closing question's answer wouldn't change the deliverable, rewrite it.

## Refusal cases

Refuse to deliver if:

- A required section is empty (return to Phase 2).
- 3+ rubric checks fail (tighten + re-run).
- Outcome metric has no measurable threshold.
- A fix path has no rollback.
- Closing questions are fake.

Surface the specific gap to the user, then re-run the relevant phase.

## References

- `references/TEMPLATE.md` — full per-slot template definitions
- `references/METHODOLOGY.md` — three-phase workflow depth + common failure modes
- `references/RUBRIC.md` — 44-point quality bar with failure modes + per-type weighting
- `references/GOAL-TYPES.md` — adaptive section matrix + auto-detection heuristics
- `references/EXAMPLE.md` — fully-filled worked example (Mission Control unification goal)

Upstream: https://github.com/apple-techie/perfect-goal
