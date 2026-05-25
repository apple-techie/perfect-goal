# Project Overrides — `.perfect-goal/overrides.md`

Each project that uses Perfect Goal can ship a per-project override file at `.perfect-goal/overrides.md` (relative to repo root). The `/perfect-goal` skill/command reads this file before Phase 1 and merges its directives into the template's required-section list, default flags, memory roots, and trap catalog seeds.

## Why override per-project

A startup web app has different shape from an infra repo from a data pipeline. Forcing the same defaults across all of them produces friction. The override file lets each project pre-load:

- Which sections are always required (e.g. an infra repo might always require risk register).
- Where MEMORY.md lives for cross-referencing.
- The fleet's standard verification commands (health endpoints, CI invocations).
- The project's stakeholder list.
- Known project-specific traps that should seed §10.2 of every new goal.

## Schema

```yaml
---
# .perfect-goal/overrides.md
# All fields optional. Omitted fields fall back to skill defaults.

project_name: <human-readable name>      # e.g. "Mission Control"

# Sections required regardless of goal type. Use sparingly — overuse hides the type taxonomy's value.
always_required_sections:
  - "6"   # Risk register
  - "9"   # Telemetry plan

# Sections allowed to skip even if the type would require them. Use sparingly.
always_skip_sections: []

# Where memory lives (used for [[name]] cross-references)
memory_root: /Users/<you>/.claude/projects/<encoded-cwd>/memory

# Standard verification commands seeded into §5 matrix
verification_commands:
  health:
    - command: 'curl -s https://<your-app>/api/health'
      expected: '{"status":"ok"}'
    - command: 'kubectl get pods -n production --field-selector status.phase!=Running'
      expected: 'no resources'
  deploy:
    - command: 'gh workflow view deploy.yml --json runs --jq ".[0].conclusion"'
      expected: 'success'

# Stakeholder defaults for §8
stakeholder_defaults:
  - name: "Customer success"
    role: "Affected"
    channel: "Slack #cs-eng"
  - name: "On-call eng"
    role: "Watcher"
    channel: "PagerDuty"

# Trap catalog seeds — pre-populated into §10.2 of every goal
trap_catalog_seeds:
  - "Postgres connection pool exhaustion under burst load — see [[reference_postgres_pool]]"
  - "Stripe webhook retries can arrive out-of-order — idempotency keys required"
  - "Our staging env uses different IAM role than prod; auth tests must run against prod-staging"

# Default flags (override the skill's global defaults)
default_flags:
  window: 60         # we have lots of churn; pull more history
  scope: wide        # most goals here cross multiple subsystems
  tier: AB
  type: auto

# Goal-id naming convention
goal_id_prefix: mc-       # e.g. mc-billing-2026-06

# Closure artifact location pattern
closure_path_pattern: "<memory_root>/project_{goal_id}_closed.md"
---
```

## Merge semantics

Fields specified in the override file override the skill's defaults. Lists are appended (not replaced) for `trap_catalog_seeds` and `verification_commands`. The skill announces which override file it picked up before starting Phase 1, so the user can see if they meant to use it.

## Discovery

The skill looks for overrides in this order:

1. `--overrides=<path>` flag (explicit; highest priority)
2. `<cwd>/.perfect-goal/overrides.md`
3. Walk up from cwd to repo root; check `<repo_root>/.perfect-goal/overrides.md`
4. `~/.perfect-goal/overrides.md` (user-global; lowest priority)

If multiple are found, project-local wins over user-global. Don't merge across multiple project-local files — pick the first found walking up.

## Example: this repo's own overrides

`.perfect-goal/overrides.md` for the perfect-goal repo itself:

```yaml
---
project_name: "Perfect Goal Framework"

always_required_sections: []
always_skip_sections: []

# This is a tooling repo; no MEMORY.md
memory_root: ""

verification_commands:
  install:
    - command: 'bash install.sh && test -L ~/.claude/skills/perfect-goal && test -L ~/.codex/prompts/perfect-goal.md'
      expected: '(no output; exit 0)'
  rubric:
    - command: 'wc -l RUBRIC.md TEMPLATE.md METHODOLOGY.md GOAL-TYPES.md'
      expected: 'all files non-empty'

stakeholder_defaults: []

trap_catalog_seeds:
  - "Symlinks in install.sh break if user moves the repo dir — re-run install.sh after moving"
  - "Skill frontmatter must validate YAML or Claude Code silently ignores the skill"

default_flags:
  window: 40
  scope: tight
  tier: AB
  type: auto

goal_id_prefix: pg-

closure_path_pattern: "docs/goals-closed/{goal_id}.md"
---
```

## Best practices

1. **Don't over-require.** Marking a section `always_required` adds friction; only do it for sections genuinely critical to every goal in this project.
2. **Trap catalog seeds compound.** As the project surfaces traps in production, append them here. New goals inherit immunity.
3. **Memory root must be writable** by the skill — if it's a directory the AI can't reach, cross-references will be one-directional (the goal references memory but can't update it).
4. **Update the override when the project changes.** A startup that grows past its first hire should add stakeholder_defaults; a project that adopts a new alert pipeline should update verification_commands.
