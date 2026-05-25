// perfect-goal — openclaw plugin exposing the Perfect Goal framework as an HTTP endpoint.
//
// When an openclaw agent (or any caller) POSTs to /api/perfect-goal/generate with
// {topic, type?, scope?, tier?, window?, repos?}, this plugin returns the full framework
// (methodology + 13-section template + 44-point rubric + per-type adaptive matrix) with
// the topic primed as Phase 1 context.
//
// HOW IT'S USED:
// - Path-loaded openclaw plugins (this one) expose HTTP endpoints, NOT agent-facing
//   tools directly. Tool surfacing happens separately via MCP server config or via
//   the agent's generic HTTP-fetch capability.
// - Agents that want perfect_goal as a callable tool either: (a) wrap this endpoint
//   via MCP, (b) use a fetch_url style tool to hit it, or (c) the operator can dispatch
//   an MC task to this gateway whose handler hits the endpoint.
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
      logger.warn(`[perfect-goal] framework file unreadable: ${path}: ${err.message || err}`);
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

function validateArgs(args, defaults) {
  if (!args || typeof args !== "object") {
    return { error: "request body must be a JSON object" };
  }
  const topic = typeof args.topic === "string" ? args.topic.trim() : "";
  if (!topic) return { error: "topic is required (non-empty string)" };

  const goalType = (typeof args.type === "string" ? args.type.trim() : "") || defaults.type;
  if (!VALID_TYPES.has(goalType)) {
    return { error: `type must be one of ${[...VALID_TYPES].sort().join("|")}; got ${JSON.stringify(goalType)}` };
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
  return { topic, type: goalType, scope, tier, window, repos };
}

export default definePluginEntry({
  id: "perfect-goal",
  name: "Perfect Goal",
  description:
    "HTTP endpoint exposing the Perfect Goal framework. POST /api/perfect-goal/generate " +
    "with {topic, type?, scope?, tier?, window?, repos?} returns methodology + template + " +
    "rubric + goal-type matrix primed with the caller's topic.",
  register(api) {
    const logger = api.logger;
    const config = api.pluginConfig || {};

    const frameworkDir = config.frameworkPath
      ? resolve(config.frameworkPath)
      : DEFAULT_FRAMEWORK_DIR;
    const defaults = {
      type: config.defaultType || "auto",
      scope: config.defaultScope || "tight",
      tier: config.defaultTier || "AB",
    };

    // Load framework files once at register-time. They're static; no need to
    // re-read per request. Result-cache survives plugin lifecycle.
    let frameworkCache = null;
    let frameworkLoadedAt = 0;
    async function getFramework() {
      if (frameworkCache) return frameworkCache;
      frameworkCache = await loadFramework(frameworkDir, logger);
      frameworkLoadedAt = Date.now();
      return frameworkCache;
    }

    // Probe framework dir at startup for an early-signal log.
    (async () => {
      try {
        const s = await stat(frameworkDir);
        logger.info(
          `[perfect-goal] starting (frameworkDir=${frameworkDir}, exists=${s.isDirectory()}, defaults=${JSON.stringify(defaults)})`,
        );
      } catch {
        logger.warn(
          `[perfect-goal] starting BUT frameworkDir not found: ${frameworkDir} — framework fields will be empty until path is fixed`,
        );
      }
    })();

    api.registerHttpRoute({
      path: "/api/perfect-goal/generate",
      auth: "gateway",
      match: "exact",
      handler: async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "method not allowed; use POST" }));
          return;
        }
        let body = "";
        try {
          for await (const chunk of req) body += chunk;
        } catch (err) {
          res.statusCode = 400;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: `body read failed: ${err.message || err}` }));
          return;
        }
        let parsed;
        try {
          parsed = body ? JSON.parse(body) : {};
        } catch (err) {
          res.statusCode = 400;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: `JSON parse failed: ${err.message || err}` }));
          return;
        }
        const validated = validateArgs(parsed, defaults);
        if (validated.error) {
          res.statusCode = 400;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: validated.error }));
          return;
        }
        const framework = await getFramework();
        const response = {
          topic: validated.topic,
          flags: {
            type: validated.type,
            scope: validated.scope,
            tier: validated.tier,
            window: validated.window,
            repos: validated.repos,
          },
          instructions: buildInstructions(validated.topic),
          framework,
          version: "0.1.1",
          upstream: "https://github.com/apple-techie/perfect-goal",
        };
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(response));
      },
    });

    // Health probe — useful for verifying the plugin loaded + framework dir resolves.
    api.registerHttpRoute({
      path: "/api/perfect-goal/health",
      auth: "gateway",
      match: "exact",
      handler: async (_req, res) => {
        let frameworkOk = false;
        try {
          const s = await stat(frameworkDir);
          frameworkOk = s.isDirectory();
        } catch {
          frameworkOk = false;
        }
        const fw = frameworkCache;
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(
          JSON.stringify({
            status: frameworkOk ? "ok" : "degraded",
            frameworkDir,
            frameworkPresent: frameworkOk,
            frameworkCached: !!fw,
            frameworkLoadedAt: frameworkLoadedAt || null,
            defaults,
            version: "0.1.1",
          }),
        );
      },
    });

    logger.info("[perfect-goal] HTTP routes registered: /api/perfect-goal/{generate,health}");
  },
});
