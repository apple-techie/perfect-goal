// perfect-goal — openclaw plugin exposing the Perfect Goal framework as a tool.
//
// When an openclaw agent calls perfect_goal({topic, type, scope, tier, window, repos}),
// this plugin returns the full framework (methodology + 13-section template + 44-point
// rubric + per-type adaptive matrix) with the caller's topic primed as Phase 1 context.
// The agent then continues the workflow in its own LLM context.
//
// Design — same as the hermes sibling: the plugin is THIN. No LLM calls from here;
// the calling agent's own context does the synthesis. Provider-agnostic, no extra
// spend, no plugin-side state to manage.
//
// Upstream framework: https://github.com/apple-techie/perfect-goal

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_FRAMEWORK_DIR = join(PLUGIN_DIR, "framework");

const VALID_TYPES = new Set([
  "bug",
  "feature",
  "migration",
  "infra",
  "research",
  "refactor",
  "unification",
  "auto",
]);
const VALID_SCOPES = new Set(["tight", "wide"]);
const VALID_TIERS = new Set(["A", "AB", "ABC"]);

const FRAMEWORK_FILES = [
  ["methodology", "METHODOLOGY.md"],
  ["template", "TEMPLATE.md"],
  ["rubric", "RUBRIC.md"],
  ["goal_types", "GOAL-TYPES.md"],
];

async function readFrameworkFile(frameworkDir, filename, logger) {
  const path = join(frameworkDir, filename);
  try {
    return await readFile(path, "utf-8");
  } catch (err) {
    if (err && err.code === "ENOENT") {
      logger.warn(`[perfect-goal] framework file missing: ${path}`);
    } else {
      logger.warn(`[perfect-goal] framework file unreadable: ${path}`, err);
    }
    return "";
  }
}

async function loadFramework(frameworkDir, logger) {
  const out = {};
  for (const [key, filename] of FRAMEWORK_FILES) {
    out[key] = await readFrameworkFile(frameworkDir, filename, logger);
  }
  return out;
}

function buildInstructions(topic) {
  return (
    `You are running the Perfect Goal framework. Topic: ${JSON.stringify(topic)}.\n\n` +
    "Phase 1 — Evidence-anchored synthesis: pull recent commits across involved " +
    "repos, cluster into 3-6 themes, state the originating outcome in ONE sentence " +
    "with receipts inline. Wait for confirmation before Phase 2.\n\n" +
    "Phase 2 — Gap + state inventory: classify each theme as shipped/halfway/open; " +
    "decompose every open gap with all 7 ingredients (signal, hypothesis tree, " +
    "probes, fix paths, rollback, reproduces-also-on, success metric).\n\n" +
    "Phase 3 — 100x compression: fill the 13-section template; validate against " +
    "the 44-point rubric (refuse to deliver if 3+ checks fail); close with three " +
    "real-branch scoping questions.\n\n" +
    "The full methodology, template, rubric, and goal-type matrix are in the " +
    "'framework' fields below. Read them before starting Phase 1."
  );
}

// Tool handler — receives validated args, returns the framework payload object.
// openclaw stringifies the return automatically when surfacing to the agent.
function makeHandler({ framework, defaults }) {
  return async function perfectGoalHandler(rawArgs) {
    const args = rawArgs && typeof rawArgs === "object" ? rawArgs : {};
    const topic = typeof args.topic === "string" ? args.topic.trim() : "";
    if (!topic) {
      return { error: "topic is required (non-empty string)" };
    }

    const goalType = (typeof args.type === "string" ? args.type.trim() : "") || defaults.type;
    if (!VALID_TYPES.has(goalType)) {
      return {
        error: `type must be one of ${[...VALID_TYPES].sort().join("|")}; got ${JSON.stringify(goalType)}`,
      };
    }

    const scope = (typeof args.scope === "string" ? args.scope.trim() : "") || defaults.scope;
    if (!VALID_SCOPES.has(scope)) {
      return { error: `scope must be tight|wide; got ${JSON.stringify(scope)}` };
    }

    const tier = (typeof args.tier === "string" ? args.tier.trim() : "") || defaults.tier;
    if (!VALID_TIERS.has(tier)) {
      return { error: `tier must be A|AB|ABC; got ${JSON.stringify(tier)}` };
    }

    const window = Number.isInteger(args.window) ? args.window : 40;
    if (window < 1 || window > 500) {
      return { error: `window must be an integer in [1, 500]; got ${window}` };
    }

    const repos = Array.isArray(args.repos)
      ? args.repos.filter((r) => typeof r === "string")
      : [];

    return {
      topic,
      flags: { type: goalType, scope, tier, window, repos },
      instructions: buildInstructions(topic),
      framework,
      version: "0.1.0",
      upstream: "https://github.com/apple-techie/perfect-goal",
    };
  };
}

export default definePluginEntry({
  id: "perfect-goal",
  async onStartup({ ctx, config, logger }) {
    const frameworkDir = config.frameworkPath
      ? resolve(config.frameworkPath)
      : DEFAULT_FRAMEWORK_DIR;

    // Probe + report on framework presence so install issues are visible at boot.
    let frameworkPresent = false;
    try {
      const s = await stat(frameworkDir);
      frameworkPresent = s.isDirectory();
    } catch {
      frameworkPresent = false;
    }
    logger.info("[perfect-goal] starting", {
      frameworkDir,
      frameworkPresent,
      defaults: {
        type: config.defaultType || "auto",
        scope: config.defaultScope || "tight",
        tier: config.defaultTier || "AB",
      },
    });

    const framework = await loadFramework(frameworkDir, logger);

    const handler = makeHandler({
      framework,
      defaults: {
        type: config.defaultType || "auto",
        scope: config.defaultScope || "tight",
        tier: config.defaultTier || "AB",
      },
    });

    ctx.registerTool({
      name: "perfect_goal",
      description:
        "Produce a 100x-leverage goal prompt. Returns the Perfect Goal framework " +
        "(methodology, 13-section template, 44-point rubric, goal-type matrix) primed " +
        "with the caller's topic as Phase 1 context. The agent continues the workflow " +
        "in its own LLM context.",
      schema: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description:
              "One-line description of the goal to build a prompt for, OR the literal " +
              "'from recent history' to derive from recent commits.",
          },
          type: {
            type: "string",
            enum: [...VALID_TYPES].sort(),
            description: "Goal type — drives required vs skippable sections. 'auto' infers from topic.",
          },
          scope: {
            type: "string",
            enum: [...VALID_SCOPES].sort(),
            description: "tight = single thread; wide = include related side-quests.",
          },
          tier: {
            type: "string",
            enum: [...VALID_TIERS].sort(),
            description:
              "A = quickest ship; AB = ship + next phase planned; ABC = long-term included.",
          },
          window: {
            type: "integer",
            minimum: 1,
            maximum: 500,
            description: "Commits per repo to review in Phase 1. Default 40.",
          },
          repos: {
            type: "array",
            items: { type: "string" },
            description: "Repo paths to pull history from. Auto-detect if omitted.",
          },
        },
        required: ["topic"],
      },
      handler,
    });

    logger.info("[perfect-goal] tool 'perfect_goal' registered");
  },
});
