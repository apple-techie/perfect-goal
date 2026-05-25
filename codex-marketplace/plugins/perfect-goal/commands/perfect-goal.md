---
description: "Build a 100x-leverage goal prompt — three-phase evidence synthesis, 13-section output, 44-point quality rubric. Pass a topic or 'from recent history'."
---

# Perfect Goal

You are running the Perfect Goal framework. The goal is to produce a prompt that lets an executing agent run with **zero discretionary decisions left** — every category of decision pre-decided, every claim receipt-anchored.

User input: `$arguments` (topic, or `from recent history` to derive from recent commits in this repo)

## Phase 1 — Evidence-anchored synthesis

1. Identify involved repos: cwd + sibling project dirs if cross-repo.
2. Pull recent commits in parallel:
   ```bash
   for r in <repos>; do git -C $r log --oneline -40; done
   ```
3. Cluster commits into 3–6 themes anchored to SHAs.
4. State the originating outcome in **ONE sentence** with receipts inline.
5. Wait for user confirmation before Phase 2.

**Non-negotiable:** no synthesis without commit-anchored receipts.

## Phase 2 — Gap + state inventory

For each theme: classify shipped / halfway / open.

- **Shipped** → row in receipts table with SHA + verification command.
- **Halfway** → name the open delta.
- **Open** → full decomposition with ALL 7 ingredients:
  1. Observed signal (verbatim — log lines, error text)
  2. Hypothesis tree (H1/H2/H3 numbered, falsifiable, best guess first)
  3. Pre-staged investigation (paste-ready shell commands)
  4. Fix paths (cost-ordered: cheapest first, with effort + risk)
  5. Rollback procedure (specific commands)
  6. Reproduces also on (other surfaces or "unknown — needs probe")
  7. Success metric (number + unit)

Cross-reference memory via `[[memory-name]]` form. Explicitly list out-of-scope side-quests.

## Phase 3 — 100x compression

Fill the 13-section template. Validate against the 44-point rubric. Close with **three real-branch scoping questions**.

### Output shape — 13 sections in order

1. **Front matter** (YAML) — goal_id, owner, opened_at, target_close, status, type, tier, scope, priority, repos, memory_root
2. **Strategic anchor** — north star (1 sentence) + 5 Whys + counter-position + why-now
3. **Ground truth** — authoritative inventory + receipts table + recent evidence
4. **Gap decomposition** — one block per gap, 7 ingredients each
5. **Success metrics** — outcome / output / leading / lagging / anti-metrics / cost budget / quality gates / time-boxed checkpoints
6. **Verification matrix** — 8–15 boolean rows with paste-able commands
7. **Risk register** (conditional by type)
8. **Dependencies graph** (conditional)
9. **Stakeholder map** (conditional)
10. **Telemetry plan** (conditional)
11. **Operational guardrails** — constraints + trap catalog (≥5) + anti-goals + decision log
12. **Execution playbook** — priority + delegation + escalation + agreements + comms
13. **Closure** — DoD + NOT-done + docs deliverable + onboarding pointers + 3 real-branch scoping questions

## Goal types — section requirements

| Type | Skip | Tuning |
|---|---|---|
| bug | §6 §7 §8 §9 | Deep hypothesis tree; success = symptom absent in prod 24h |
| feature | none | Stakeholder map + telemetry non-negotiable |
| migration | none | Risk register + rollback per stage critical |
| infra | none | ≥10 traps; tighter escalation; plan-mode-first |
| research | §5 §6 §7 §9 | Replace §5 with research-question + yes/no/inconclusive implications |
| refactor | §6 §7 §8 | Anti-metrics dominate; counter-position load-bearing |
| unification | none | All 13; fragmentation-reduction metric in §4 |

## Quality bar (run before delivering)

Walk all 44 rubric checks. If 3+ fail, tighten and re-run.

Common pre-flight failures:
- North Star more than one sentence → trim
- "Shipped" claim with no SHA → inline or downgrade to halfway
- Gap with no H1/H2/H3 hypothesis tree → add it
- Success metric with no unit → pin to a number
- Constraint without memory reference → link it
- Closing question is "does this look good?" → rewrite as a real branch

## Closing pattern (mandatory)

End with three scoping questions where each answer changes the deliverable shape.

**Banned:** "Does this look good?", "Should I proceed?", "Any feedback?"

**Valid:** "Bundle Phase B or split into a follow-up?", "Include side-quests #5/#6/#7 or kick to a separate hygiene sweep?", "Accept 14-day target close or pull in to 7 by dropping gap #7?"

## Refusal cases

Refuse to deliver if:
- A required section is empty (return to Phase 2)
- 3+ rubric checks fail (tighten + re-run)
- Outcome metric has no measurable threshold
- A fix path has no rollback
- Closing questions are fake

## References

Full framework, methodology, template, rubric, goal-types matrix, and a worked example are in `skills/perfect-goal/references/` of this plugin. Read them before starting Phase 1.

Upstream: https://github.com/apple-techie/perfect-goal

---

Begin Phase 1 now with the user's argument above.
