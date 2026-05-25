---
name: perfect-goal
description: Produce a 100×-leverage /goal prompt via evidence-first synthesis → gap inventory → density compression. Use when the user asks to "build a goal", "write a /goal prompt", "perfect-goal", or when filing a multi-step initiative that will be handed to a coding agent or future-self for execution. The skill enforces a 13-section output, a 44-point quality rubric, and per-type adaptive section requirements (bug / feature / migration / infra / research / refactor / unification).
---

# Perfect Goal — Skill Instructions

You are running the Perfect Goal framework. Follow the three-phase workflow EXACTLY. Skipping a phase or a required section produces a goal that looks complete but isn't. The agent receiving your output will execute with zero discretionary decisions left, so every gap you leave becomes either a clarifying round-trip or a silent wrong call.

## Inputs

The user may provide:

- An explicit topic (e.g. "migrate auth from JWT to session cookies")
- The phrase "from recent history" — derive the topic from recent conversation + commits
- Flags: `--window=N`, `--repos=...`, `--scope=wide|tight`, `--tier=A|AB|ABC`, `--type=<type>`

Default flags: `--window=40 --scope=tight --tier=AB --type=auto`.

## Phase 1 — Evidence-anchored synthesis

**Goal:** state the originating outcome in one sentence, with receipts.

1. Identify involved repos:
   - cwd's repo (always)
   - Sibling project dirs (search 1–2 levels up for `.git`)
   - Memory file references for cross-cutting topics
   - Honor explicit `--repos=...` flag if provided
2. Pull recent history in parallel (one Bash tool call with `&` or a for-loop):
   ```bash
   for r in <repos>; do echo "=== $r ==="; git -C $r log --oneline -<window>; done
   ```
3. Cluster commits into 3–6 themes. Each theme: one-line description + anchor SHAs + status guess.
4. State your read of the originating outcome in **one sentence**, with receipts inline.
5. Wait for user confirmation OR cite implicit confirmation before Phase 2. **Do not proceed without a confirmation signal.**

## Phase 2 — Gap + state inventory

**Goal:** for every theme, honest accounting of shipped / halfway / open.

1. Per theme: classify as shipped (with verification evidence), halfway (open delta named), or open (full decomposition).
2. Build the authoritative inventory: every entity the executing agent will touch, with identifier.
3. For each open gap, fill all SEVEN ingredients:
   - Observed signal (verbatim — log lines, error text, screenshot description)
   - Hypothesis tree (H1/H2/H3, falsifiable, best guess first)
   - Pre-staged investigation (paste-ready shell)
   - Fix paths (cheapest first, with effort + risk labels)
   - Rollback procedure (specific commands)
   - Reproduces also on (or "unknown — needs probe")
   - Success metric (number + unit)
4. Cross-reference all relevant `[[memory-name]]` entries from MEMORY.md.
5. Explicitly list out-of-scope side-quests.

## Phase 3 — 100× compression

**Goal:** fill the 13-section template, validate against the 44-point rubric, deliver.

Produce the 13-section output exactly in this order:

1. **Front matter** (YAML) — `goal_id`, `owner`, `opened_at`, `target_close`, `status`, `type`, `tier`, `scope`, `priority`, `repos`, `memory_root`
2. **Strategic anchor** — North Star (1 sentence) + 5 Whys (5 layers, bottom is non-technical) + Counter-position (steel-manned + addressed) + Why now (timing receipts, ≤120 words)
3. **Ground truth** — Authoritative inventory + Current state receipts table (Workstream | Status | Commits | Verification) + Recent evidence anchor
4. **Gap decomposition** — One subsection per gap with all 7 ingredients
5. **Success metrics** — Outcome / Output / Leading / Lagging / Anti-metrics / Cost budget (hours + $ + opportunity) / Quality gates / Time-boxed checkpoints
6. **Verification matrix** — 8–15 boolean rows with paste-able commands
7. **Risk register** (conditional by type) — Risk | Probability | Impact | Mitigation | Owner | Escalation trigger
8. **Dependencies graph** (conditional) — ASCII or mermaid
9. **Stakeholder map** (conditional) — Stakeholder | Role | Notify-before | Approve | Channel
10. **Telemetry plan** (conditional) — Metric | Source | Store | Dashboard | Alert
11. **Operational guardrails** — Constraints (numbered, memory-ref'd) + Trap catalog (≥5 for fleet goals) + Anti-goals + Decision log
12. **Execution playbook** — Priority + sequencing / Sub-agent delegation map / Escalation triggers / Working agreements / Communication plan
13. **Closure** — Definition of done / Definition of NOT done / Documentation deliverable / Pointers for fast onboarding
14. **Sign-off** — Three real scoping questions (each a real branch in the goal)

Section requirements adapt by goal type — see `GOAL-TYPES.md` for the matrix. Auto-detect type from topic keywords + commit patterns; honor explicit `--type=<type>` override.

## Rubric validation (run BEFORE delivering)

Walk all 44 checks in `RUBRIC.md`. Mark pass/fail/N/A per check. N/A is only valid for conditional sections marked optional/skip for the goal's type.

If 3+ checks fail (counting type-weighted checks at their weight), DO NOT DELIVER. Tighten the prompt and re-run the rubric.

Common failures to pre-check:

- North Star is more than one sentence → trim
- A "shipped" claim has no SHA → inline the SHA or downgrade to halfway
- A gap has no hypothesis tree → add H1/H2/H3
- A success metric has no unit → pin to a number
- A constraint has no memory reference → link it
- Closing question is "does this look good?" → rewrite as a real branch

## Output delivery

Deliver as a single markdown artifact. The user will paste it into `/goal` (or save to a goal-tracking file).

If running interactively in Claude Code or Codex, present the prompt verbatim in the assistant message. If saving to a file, default location is `<repo>/goals/<goal_id>.md` or honor user-specified path.

## Closing protocol (always)

End EVERY produced prompt with three scoping questions. Each must be a real branch — would the deliverable shape change if the user answered differently? If no, the question isn't real; rewrite.

**Banned closing patterns** (these have all failed in production):

- "Does this look good?"
- "Should I proceed?"
- "Any feedback?"
- "Let me know if you'd like changes."

**Valid closing patterns:**

- "Bundle Phase B or split into a follow-up?"
- "Include side-quests #5/#6/#7 or kick to a hygiene sweep?"
- "Accept 14-day target close or pull in to 7 by dropping #7?"

## Project overrides

Before Phase 1, check for `.perfect-goal/overrides.md` in cwd. If present, merge its directives (required sections, memory roots, standard verification commands, stakeholder defaults, trap catalog seeds) into the template requirements.

## Failure modes to refuse

You MUST refuse to deliver a goal that:

- Has an empty required section (return to Phase 2)
- Failed 3+ rubric checks (tighten + re-run)
- Has a "vibes" outcome metric without a measurable threshold
- Has no rollback procedure for a fix path
- Has fake closing questions

In all four cases, surface the failure to the user with the specific gap, then re-run the relevant phase.

## Self-check before delivering

Final pre-delivery check, in your own voice as the skill:

1. Did I anchor every "shipped" claim to a SHA or DB receipt?
2. Did I write a hypothesis tree (H1/H2/H3) for every open gap?
3. Did I provide paste-able shell for every verification matrix row?
4. Did I cite the memory file behind every constraint?
5. Did I close with three real-branch scoping questions?

If any answer is no, return to the relevant phase.

## Reference files (read alongside this skill)

- `TEMPLATE.md` — the full 13-section template with per-slot guidance
- `METHODOLOGY.md` — the three-phase workflow in depth
- `RUBRIC.md` — the 44-point quality bar
- `GOAL-TYPES.md` — per-type required/optional/skip section matrix
- `examples/*.md` — worked examples per goal type
