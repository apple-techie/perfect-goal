# Perfect Goal

> A framework + slash command + skill for producing AI-agent prompts that extract 100× the leverage of a typical "goal" prompt.

Most goal prompts fail the moment a coding agent picks them up. They name an outcome ("ship the payments rewrite"), gesture at constraints ("don't break prod"), and assume the agent will derive the rest. The agent then spends its first thousand tokens re-discovering what the author already knew — current state, named entities, prior decisions, traps, success thresholds. By the time it starts actual work, it's burned half its context budget and made discretionary calls the author should have made.

**Perfect Goal flips that.** It encodes a three-phase workflow (evidence-first synthesis → honest gap inventory → density-maximizing compression) and a 13-section output shape where every slot is load-bearing. An agent receiving a Perfect Goal prompt has zero discretionary decisions left to make. It executes.

This repo ships:

- The **template** (`TEMPLATE.md`) — the 13-section, ~40-subsection output shape.
- The **methodology** (`METHODOLOGY.md`) — the three-phase workflow that produces it.
- The **rubric** (`RUBRIC.md`) — 40-point quality bar every prompt must clear.
- The **goal-type taxonomy** (`GOAL-TYPES.md`) — which sections are required per goal type (bug / feature / migration / infra / research / refactor).
- **Worked examples** under `examples/`.
- A **Claude Code skill** (`skills/perfect-goal/SKILL.md`) that auto-invokes the framework.
- A **Claude Code slash command** (`commands/claude/perfect-goal.md`) for explicit invocation.
- A **Codex CLI slash command** (`commands/codex/perfect-goal.md`) — same framework, Codex-native.
- An **install script** (`install.sh`) that symlinks both into your home dirs.

---

## The problem this solves

A typical goal prompt looks like this:

> "Migrate our auth from JWT to session cookies. Don't break existing users."

That prompt forces the agent to make ~30 discretionary decisions before writing a single line of code:

- What does "existing users" mean — current month's actives? all-time? authenticated right now?
- Is there a parallel-run period or hard cutover?
- What's the rollback procedure if 5% of users fail to re-auth?
- Which environments roll first?
- What success metric proves it worked — error rate? login rate? support ticket volume?
- What's an acceptable regression on login latency?
- Who owns the customer comms?
- What memory / trap-knowledge should the agent inherit?
- ...

Each undecided question is either (a) silently decided by the agent in a way you'll disagree with later, or (b) surfaced as a clarifying question that costs a round-trip. Both outcomes are 10× worse than the author having pre-decided.

**Perfect Goal makes pre-deciding mandatory.** The template has explicit slots for every category of decision. If you can't fill a slot, the goal isn't ready to file.

---

## The three-phase workflow

Every Perfect Goal prompt goes through these phases, in order. Skipping a phase produces a goal that looks complete but isn't.

### Phase 1 — Evidence-anchored synthesis

Before declaring what the goal is, gather the receipts.

1. Pull recent commits across every involved repo (`git log --oneline -<N>`).
2. Cluster commits into 3–6 themes; anchor each theme to its SHAs.
3. State your reading of the original desired outcome in **one sentence**, with receipts inline.
4. Get user confirmation (or cite implicit confirmation) before Phase 2.

The non-negotiable: **no synthesis without commit-anchored receipts.** Memory and framing both decay; commits don't lie.

### Phase 2 — Gap + state inventory

For every theme: what's shipped, what's halfway, what's still open?

- Shipped items → one row in the receipts table (workstream / status / commits / verification command).
- Open items → full decomposition (signal / hypothesis tree / pre-staged probes / cost-ordered fixes / success metric).
- Cross-reference every relevant memory entry.
- Explicitly cite out-of-scope side-quests so the agent doesn't drift.

The non-negotiable: **if a verification step hasn't been executed with paste-able output, it's open.** No soft-pedaling.

### Phase 3 — 100× compression

Fill the 13-section template. Run the 40-point rubric. If 3+ rubric items fail, tighten and re-run. Close with three real scoping questions for the user (not "is this good?" — real branches in the goal).

See `METHODOLOGY.md` for full details on each phase.

---

## The 13-section output shape

Every Perfect Goal prompt has these sections, in this order. Each has required ingredients; see `TEMPLATE.md` for full slot definitions.

1. **Front matter** — goal ID, owner, opened, target close, status, type, tier
2. **Strategic anchor** — north star + 5 whys + counter-position + why-now
3. **Ground truth** — authoritative inventory + current state receipts table
4. **Gap decomposition** — per-gap signal / hypothesis tree / probes / fix paths / rollback
5. **Success metrics** — outcome / output / leading / lagging / anti-metrics / cost budget / quality gates / checkpoints
6. **Verification matrix** — boolean checklist with paste-able commands
7. **Risk register** — risk / probability / impact / mitigation / owner
8. **Dependencies graph** — what blocks what
9. **Stakeholder map** — who's affected, who approves
10. **Telemetry plan** — how we observe in production
11. **Operational guardrails** — constraints / traps / anti-goals / decision log
12. **Execution playbook** — priority / delegation / escalation / working agreements / comms
13. **Closure** — definition of done + NOT done + docs deliverable + onboarding pointers
14. **Sign-off** — three real scoping questions

Sections 1–6 + 11–14 are required for every goal. Sections 7–10 are conditional on goal type (see `GOAL-TYPES.md`).

---

## Installation

### Quick (recommended)

```bash
git clone <this-repo> ~/code/perfect-goal
cd ~/code/perfect-goal
bash install.sh
```

This symlinks:

- `skills/perfect-goal/` → `~/.claude/skills/perfect-goal/`
- `commands/claude/perfect-goal.md` → `~/.claude/commands/perfect-goal.md`
- `commands/codex/perfect-goal.md` → `~/.codex/prompts/perfect-goal.md`

### Manual

If you'd rather copy than symlink:

```bash
cp -r skills/perfect-goal ~/.claude/skills/
cp commands/claude/perfect-goal.md ~/.claude/commands/
cp commands/codex/perfect-goal.md ~/.codex/prompts/
```

The skill becomes available automatically to Claude Code (auto-invoked when relevant). The slash commands are usable in either CLI as `/perfect-goal`.

---

## Usage

### From scratch (you know your topic)

```
/perfect-goal Migrate auth from JWT to session cookies, no user-visible regression
```

The agent will:

1. Auto-detect repos involved (cwd + sibling project dirs if cross-repo).
2. Run Phase 1 (pull commit history, propose a north star with receipts).
3. Ask for confirmation or cite implicit confirmation.
4. Run Phase 2 (inventory state + gaps).
5. Produce the 13-section prompt.
6. Self-validate against the rubric and tighten if it fails.
7. Close with three scoping questions.

### From conversation context ("from recent history")

```
/perfect-goal from recent history
```

The agent reads the recent conversation + recent commits and derives the goal topic itself. This is how the framework was originally built (see `examples/mission-control-unification.md` for the bootstrap session).

### Flags

| Flag | Default | Meaning |
|---|---|---|
| `--window=<N>` | 40 | Commits per repo to review in Phase 1 |
| `--repos=<list>` | auto | Comma-separated repo paths; auto-detect from cwd + siblings if omitted |
| `--scope=wide\|tight` | tight | wide = include side-quests; tight = single thread |
| `--tier=A\|AB\|ABC` | AB | A = quickest ship only; AB = ship + plan next; ABC = include long-term |
| `--type=<goal-type>` | auto | bug / feature / migration / infra / research / refactor / unification |

---

## Examples

- **`examples/mission-control-unification.md`** — the bootstrap goal that produced this framework. Cross-cutting unification across 4 repos, 7 gaps, 13-row verification matrix.
- **`examples/stripe-billing-migration.md`** — migration template, parallel-run period, customer comms.
- **`examples/bug-payment-webhook.md`** — bug-fix template, minimal sections, hypothesis-tree-heavy.
- **`examples/feature-voice-realtime.md`** — feature launch, telemetry plan, stakeholder map.

---

## Customizing for your project

Each project's repo can ship a `.perfect-goal/overrides.md` that tunes:

- Required sections (e.g. always include risk register).
- Memory cross-reference roots (paths to your MEMORY.md or equivalent).
- Standard verification commands (your fleet's status endpoints, your CI's invocation).
- Stakeholder defaults (your team, your customers).
- Trap catalog seeds (your project's known gotchas).

The skill picks up `.perfect-goal/overrides.md` from the cwd and merges it into the template before producing output. See `docs/overrides.md` for the schema.

---

## Philosophy — why this works

Three principles:

1. **Receipts beat memory.** A SHA, a log line, a row in a table — these don't drift. Anchor every claim to one.
2. **Pre-decision beats clarification.** Each clarifying question the agent has to ask is a round-trip you could have eliminated. The template's required slots force you to pre-decide.
3. **Density beats verbosity.** Every line of the produced prompt must be load-bearing. The rubric enforces this — if a section is fluff, the rubric flags it.

The template encodes these into structure. The methodology turns the structure into a workflow. The skill/command makes the workflow one keystroke.

---

## Status + roadmap

Initial release: `v0.1.0` — covers the framework, template, rubric, four worked examples, and Claude + Codex skill/commands.

Roadmap:

- `v0.2` — auto-generate the front matter (goal ID, target close) from project context.
- `v0.3` — `perfect-goal validate <file>` standalone CLI that runs the rubric without invoking the AI.
- `v0.4` — VS Code extension preview-rendering for live linting of in-flight goals.
- `v1.0` — multi-agent execution map (when a Perfect Goal prompt is given to a coordinator agent, it auto-delegates per the execution playbook).

---

## Contributing

PRs welcome. Two rules:

1. New required sections must come with a rationale in the methodology + an example showing the slot filled.
2. New rubric items must come with the failure mode they catch (a concrete example of a goal that would have failed without the check).

---

## License

MIT. See `LICENSE`.
