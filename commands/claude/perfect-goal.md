---
description: Produce a 100×-leverage /goal prompt via evidence-first synthesis, gap inventory, and density compression. Outputs a 13-section, rubric-validated goal doc ready to paste into /goal or save to a goal-tracking file.
argument-hint: <topic or "from recent history"> [--window=N] [--repos=path1,path2] [--scope=wide|tight] [--tier=A|AB|ABC] [--type=bug|feature|migration|infra|research|refactor|unification]
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(ls:*), Bash(find:*), Bash(grep:*), Bash(rg:*), Read, Glob, Grep, TodoWrite
---

# Perfect Goal — Claude Code Slash Command

You are running the Perfect Goal framework. The framework enforces:

1. **Evidence-first synthesis** — no goal-claim without commit-anchored receipts.
2. **Honest gap inventory** — if it hasn't been verified with paste-able output, it's open.
3. **Density-maximizing compression** — a 13-section, ~40-subsection output where every slot is load-bearing.

The output is a goal prompt that lets a coding agent execute with zero discretionary decisions left to make.

## Invocation

User typed: `/perfect-goal $ARGUMENTS`

Parse the arguments:

- If `$ARGUMENTS` is empty → ask the user for a topic or `from recent history`. Do not proceed without one.
- If `$ARGUMENTS` starts with `from recent history` → derive the topic from recent conversation + recent commits.
- Otherwise → treat the leading non-flag text as the topic.

Flag defaults: `--window=40 --scope=tight --tier=AB --type=auto`.

## Phase 1 — Evidence-anchored synthesis

Execute, in order:

1. **Identify involved repos.** cwd's repo always. If `--repos` provided, use that list. Otherwise, look at sibling project dirs (1–2 levels up for `.git`) and any repos referenced in CLAUDE.md or memory.

2. **Pull commit history in parallel.** Single Bash invocation:
   ```bash
   for r in <repos>; do echo "=== $r ==="; git -C $r log --oneline -<window>; done
   ```
   Default window is 40; increase to 80 for cross-cutting goals.

3. **Cluster commits into 3–6 themes.** Per theme: one-line description, anchor SHAs (5–15 each), status guess.

4. **State your read of the originating outcome in ONE sentence**, with receipts inline. Then ask the user: *"Is that the goal? If yes I'll build the full prompt; if not, tell me where my read drifted."*

5. **Wait for confirmation.** Do not skip this step. The single most common drift point in goal-setting is synthesizing from the user's framing without commit grounding, then proceeding without confirmation.

## Phase 2 — Gap + state inventory

After confirmation:

1. **Walk every theme.** Classify shipped / halfway / open. Shipped requires SHA + verification evidence; halfway names the open delta; open requires full decomposition (Step 2.3).

2. **Build the authoritative inventory.** Every host, container, service, repo, secret store, and identifier the executing agent will touch — with its IP/port/path/auth-mode.

3. **Decompose every open gap.** All seven ingredients required:
   - Observed signal (verbatim)
   - Hypothesis tree (H1/H2/H3, falsifiable, best guess first)
   - Pre-staged shell investigation
   - Fix paths (cheapest first, with effort + risk)
   - Rollback procedure (specific commands)
   - Reproduces also on (or "unknown — needs probe")
   - Success metric (number + unit)

4. **Cross-reference memory.** Every relevant `[[memory-name]]` from MEMORY.md (or user's memory root) gets inlined as a pointer.

5. **Explicit out-of-scope.** List side-quests that surfaced but aren't part of this goal.

## Phase 3 — 100× compression

Produce the output. 13 sections, in this order:

```
---
goal_id: <kebab-case>
owner: <human>
opened_at: <YYYY-MM-DD>
target_close: <YYYY-MM-DD>
status: open
type: <bug|feature|migration|infra|research|refactor|unification>
tier: <A|AB|ABC>
scope: <tight|wide>
priority: <P0|P1|P2>
repos: [<list>]
memory_root: <path>
---

# /goal — <topic>, <date>

## 1. Strategic anchor
### 1.1 North Star (one sentence)
### 1.2 The 5 Whys (5 layers, bottom is non-technical)
### 1.3 Counter-position (steel-manned + addressed)
### 1.4 Why this matters NOW (timing receipts, ≤120 words)

## 2. Ground truth
### 2.1 Authoritative inventory
### 2.2 Current state (~X% — receipts table)
### 2.3 Recent evidence anchor

## 3. Gap decomposition
### 3.N — <Gap name>
  3.N.1 Observed signal (verbatim)
  3.N.2 Hypothesis tree
  3.N.3 Pre-staged investigation
  3.N.4 Fix paths (cost-ordered)
  3.N.5 Rollback procedure
  3.N.6 Reproduces also on
  3.N.7 Success metric

## 4. Success metrics (multi-axis)
### 4.1 Outcome metrics
### 4.2 Output metrics
### 4.3 Leading indicators
### 4.4 Lagging indicators (24h+)
### 4.5 Anti-metrics (hard ceilings)
### 4.6 Cost budget (hours + $ + opportunity)
### 4.7 Quality gates (per artifact)
### 4.8 Time-boxed checkpoints

## 5. Verification matrix (8–15 boolean rows)

## 6. Risk register (conditional — see GOAL-TYPES.md)

## 7. Dependencies graph (conditional)

## 8. Stakeholder map (conditional)

## 9. Telemetry plan (conditional)

## 10. Operational guardrails
### 10.1 Constraints (numbered, memory-ref'd)
### 10.2 Trap catalog (≥5 for fleet-touching goals)
### 10.3 Anti-goals
### 10.4 Decision log

## 11. Execution playbook
### 11.1 Priority + sequencing
### 11.2 Sub-agent delegation map
### 11.3 Escalation triggers
### 11.4 Working agreements
### 11.5 Communication plan

## 12. Closure
### 12.1 Definition of done
### 12.2 Definition of NOT done (abandon triggers)
### 12.3 Documentation deliverable
### 12.4 Pointers for fast onboarding

## 13. Sign-off
### 13.1 Three real-branch scoping questions
```

## Rubric validation (BEFORE delivering)

Walk all 44 checks in `RUBRIC.md`. Mark pass/fail/N/A. N/A only for conditional sections marked optional/skip for the goal's type.

If 3+ fail (counting type-weighted checks at their weight), DO NOT DELIVER — tighten and re-run.

## Closing protocol

End with three real-branch scoping questions. Banned: "does this look good?", "should I proceed?", "any feedback?". Required: three questions where each answer would change the deliverable shape.

## Output mode

Default: present the prompt verbatim in the assistant message so the user can copy-paste.

If the user provided `--save=<path>` or `--save` (default path `goals/<goal_id>.md`): write the file via Write, then summarize what was saved + the three closing questions inline.

## Project overrides

Before Phase 1: check for `.perfect-goal/overrides.md` in cwd. If present, read and merge its directives (required sections, memory roots, standard verification commands, stakeholder defaults, trap catalog seeds).

## Task tracking

For goals with >3 gaps, use TodoWrite to track the Phase 1/2/3 progress + per-gap decomposition state. Mark each gap's seven-ingredient completion. This prevents skipping ingredients under time pressure.

## Reference files

Read the framework files for full guidance:

- `TEMPLATE.md` — section-by-section slot definitions
- `METHODOLOGY.md` — workflow depth + common failure modes
- `RUBRIC.md` — full 44-point quality bar
- `GOAL-TYPES.md` — per-type required/optional/skip matrix
- `examples/*.md` — worked examples per goal type

These live alongside this command in the perfect-goal repo (typically `~/code/perfect-goal/`).

---

Begin Phase 1 now with the user's argument: `$ARGUMENTS`.
