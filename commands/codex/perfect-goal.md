# Perfect Goal — Codex CLI Slash Command

Codex CLI slash command. Save to `~/.codex/prompts/perfect-goal.md` or symlink via `install.sh`. Invoke as `/perfect-goal <topic or flags>`.

The framework enforces:

1. **Evidence-first synthesis** — no goal-claim without commit-anchored receipts.
2. **Honest gap inventory** — if it hasn't been verified, it's open.
3. **Density-maximizing compression** — 13 sections, ~40 subsections, every slot load-bearing.

Output is a goal prompt that lets a coding agent execute with zero discretionary decisions left.

---

## Invocation parsing

User invoked: `/perfect-goal $1`

Parse `$1`:

- Empty → ask user for topic or `from recent history`; do not proceed.
- Leading `from recent history` → derive topic from recent conversation + commits.
- Otherwise → treat leading non-flag text as the topic.

Flag defaults: `--window=40 --scope=tight --tier=AB --type=auto`.

Supported flags:

| Flag | Default | Meaning |
|---|---|---|
| `--window=<N>` | 40 | Commits per repo to review in Phase 1 |
| `--repos=<list>` | auto | Comma-separated repo paths |
| `--scope=wide\|tight` | tight | wide = include side-quests; tight = single thread |
| `--tier=A\|AB\|ABC` | AB | A = quickest ship; AB = ship + next phase; ABC = long-term |
| `--type=<type>` | auto | bug / feature / migration / infra / research / refactor / unification |
| `--save[=<path>]` | (off) | Save output to file instead of inline |

---

## Phase 1 — Evidence-anchored synthesis

1. **Identify involved repos:**
   - cwd's repo (always).
   - Sibling project dirs (search 1–2 levels up for `.git`).
   - Honor explicit `--repos=...` flag.
2. **Pull commit history in parallel** via shell:
   ```bash
   for r in <repos>; do echo "=== $r ==="; git -C "$r" log --oneline -<window>; done
   ```
3. **Cluster commits into 3–6 themes.** Per theme: one-line description, anchor SHAs, status guess.
4. **State the originating outcome in ONE sentence**, with receipts inline.
5. **Wait for user confirmation** before Phase 2. Do not skip.

---

## Phase 2 — Gap + state inventory

After confirmation:

1. Classify every theme: shipped (SHA + verification evidence required) / halfway (open delta named) / open (full decomposition).
2. Build the authoritative inventory: hosts (IPs, aliases), containers (ports, paths), services (URLs, auth), repos (paths, remotes), secrets, identifiers.
3. Decompose every open gap — all seven ingredients required:
   - Observed signal (verbatim)
   - Hypothesis tree (H1/H2/H3, falsifiable, best guess first)
   - Pre-staged shell investigation (paste-ready)
   - Fix paths (cheapest first, effort + risk)
   - Rollback procedure (specific commands)
   - Reproduces also on (or "unknown — needs probe")
   - Success metric (number + unit)
4. Cross-reference memory via `[[memory-name]]` form.
5. Explicit out-of-scope side-quests.

---

## Phase 3 — 100× compression

Produce the 13-section output, exactly in this order. Front-matter first (YAML), then sections 1–13.

```yaml
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
repos: [<paths>]
memory_root: <path>
---
```

Section list (skip sections marked optional/skip for the type per GOAL-TYPES.md):

| § | Section | Required for |
|---|---|---|
| 1 | Strategic anchor (north star + 5 whys + counter + why-now) | All |
| 2 | Ground truth (inventory + receipts table + recent evidence) | All |
| 3 | Gap decomposition (one block per gap, 7 ingredients each) | All |
| 4 | Success metrics (outcome / output / leading / lagging / anti / cost / quality / checkpoints) | All |
| 5 | Verification matrix (8–15 boolean rows, paste-able commands) | All |
| 6 | Risk register | migration, infra, feature |
| 7 | Dependencies graph (ASCII/mermaid) | migration, feature, infra, unification |
| 8 | Stakeholder map | feature, migration, infra |
| 9 | Telemetry plan (with alert thresholds) | feature, infra, migration |
| 10 | Operational guardrails (constraints + trap catalog ≥5 + anti-goals + decision log) | All |
| 11 | Execution playbook (priority + delegation + escalation + agreements + comms) | All |
| 12 | Closure (DoD + NOT-done + docs deliverable + onboarding pointers) | All |
| 13 | Sign-off (three real-branch scoping questions) | All |

---

## Rubric validation (BEFORE delivering)

Walk all 44 checks. Mark pass/fail/N/A. N/A only for conditional sections per goal type.

If 3+ fail (counting type-weighted checks at their weight), do not deliver. Tighten and re-run.

Quick checks:

- North Star is exactly one sentence (not a list, not a paragraph)
- Every "shipped" claim has SHA receipt
- Every gap has H1/H2/H3 hypothesis tree
- Every verification row has paste-able shell
- Every constraint links to establishing memory/incident
- ≥5 traps in catalog for fleet-touching goals
- Closing questions are real branches, not "does this look good?"

---

## Output mode

Default: print the goal prompt to the assistant message verbatim. User copy-pastes into `/goal` or saves manually.

If `--save[=<path>]` provided: write to file (default `goals/<goal_id>.md`), then print a short summary + the three closing questions inline so the user sees the next-decision point.

---

## Project overrides

Before Phase 1: check for `.perfect-goal/overrides.md` in cwd. If present, read it; merge its directives (required sections, memory roots, standard verification commands, stakeholder defaults, trap catalog seeds) into the template requirements.

---

## Closing protocol

End EVERY produced prompt with three scoping questions where each is a real branch in the goal.

Banned closings:

- "Does this look good?"
- "Should I proceed?"
- "Any feedback?"
- "Let me know if you'd like changes."

Valid closings:

- "Bundle Phase B in this goal or split into a follow-up?"
- "Include side-quests #5/#6/#7 or kick to a separate hygiene sweep?"
- "Accept 14-day target close or pull in to 7 by dropping gap #7?"

If your closing question's answer wouldn't change the deliverable shape, rewrite it.

---

## Refusal cases

Refuse to deliver if:

- A required section is empty (return to Phase 2)
- 3+ rubric checks fail (tighten + re-run)
- Outcome metric has no measurable threshold
- A fix path has no rollback
- Closing questions are fake

Surface the specific gap to the user, then re-run the relevant phase.

---

## Reference files

Read alongside this command:

- `TEMPLATE.md` — full section slot definitions
- `METHODOLOGY.md` — workflow depth
- `RUBRIC.md` — 44-point quality bar
- `GOAL-TYPES.md` — per-type required/optional matrix
- `examples/*.md` — worked examples

These live in the perfect-goal repo (typically `~/code/perfect-goal/` after installation).

---

Begin Phase 1 with: `$1`.
