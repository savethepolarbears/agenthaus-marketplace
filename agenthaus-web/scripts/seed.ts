/**
 * Seed script: reads plugin directories and populates the Neon database.
 * Run with: npx tsx scripts/seed.ts
 * Requires DATABASE_URL in environment.
 */

import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const CATEGORY_MAP: Record<string, string> = {
  "social-media": "content",
  "github-integration": "devops",
  "cloudflare-platform": "cloud",
  "vercel-deploy": "deployment",
  "devops-flow": "devops",
  "notion-workspace": "knowledge",
  "context7-docs": "docs",
  "knowledge-synapse": "rag",
  "clickup-tasks": "productivity",
  "task-commander": "productivity",
  "playwright-testing": "qa",
  "qa-droid": "testing",
  "neon-db": "database",
  "data-core": "database",
  "marketplace-cli": "utility",
  "ux-ui": "ux",
  "agent-handoff": "orchestration",
  "circuit-breaker": "safety",
  "agent-memory": "memory",
  "shadow-mode": "training",
  "fleet-commander": "orchestration",
  "plugin-auditor": "security",
  "openclaw-bridge": "integration",
};

const ENV_VAR_MAP: Record<string, { var_name: string; description: string }[]> = {
  "cloudflare-platform": [
    { var_name: "CLOUDFLARE_API_TOKEN", description: "Cloudflare API token" },
    { var_name: "CLOUDFLARE_ACCOUNT_ID", description: "Cloudflare account ID" },
  ],
  "vercel-deploy": [
    { var_name: "VERCEL_TOKEN", description: "Vercel authentication token" },
  ],
  "github-integration": [
    { var_name: "GITHUB_TOKEN", description: "GitHub personal access token" },
  ],
  "devops-flow": [
    { var_name: "CLOUDFLARE_API_TOKEN", description: "Cloudflare API token" },
    { var_name: "CLOUDFLARE_ACCOUNT_ID", description: "Cloudflare account ID" },
    { var_name: "GITHUB_TOKEN", description: "GitHub personal access token" },
    { var_name: "SLACK_BOT_TOKEN", description: "Slack bot token" },
    { var_name: "SLACK_CHANNEL", description: "Slack channel ID" },
  ],
  "notion-workspace": [
    { var_name: "NOTION_API_KEY", description: "Notion API integration key" },
  ],
  "knowledge-synapse": [
    { var_name: "CONTEXT7_KEY", description: "Context7 API key" },
    { var_name: "NOTION_KEY", description: "Notion API key" },
    { var_name: "GOOGLE_DRIVE_TOKEN", description: "Google Drive OAuth token" },
  ],
  "clickup-tasks": [
    { var_name: "CLICKUP_API_TOKEN", description: "ClickUp API token" },
    { var_name: "CLICKUP_TEAM_ID", description: "ClickUp team ID" },
  ],
  "task-commander": [
    { var_name: "CLICKUP_KEY", description: "ClickUp API key" },
    { var_name: "SLACK_TOKEN", description: "Slack bot token" },
    { var_name: "SLACK_CHANNEL", description: "Slack channel ID" },
    { var_name: "GMAIL_CREDS", description: "Gmail OAuth credentials" },
    { var_name: "GOOGLE_CALENDAR_TOKEN", description: "Google Calendar token" },
  ],
  "qa-droid": [
    { var_name: "SLACK_TOKEN", description: "Slack bot token" },
    { var_name: "SLACK_CHANNEL", description: "Slack channel ID" },
    { var_name: "GMAIL_CREDS", description: "Gmail OAuth credentials" },
  ],
  "neon-db": [
    { var_name: "DATABASE_URL", description: "Neon Postgres connection string" },
    { var_name: "NEON_API_KEY", description: "Neon platform API key" },
  ],
  "data-core": [
    { var_name: "DATABASE_URL", description: "Neon Postgres connection string" },
    { var_name: "NEON_API_KEY", description: "Neon platform API key" },
  ],
};

interface PluginJson {
  name: string;
  description: string;
  version?: string;
  author?: string;
  homepage?: string;
  tags?: string[];
  commands?: string[];
  agents?: string[];
  skills?: string[];
  hooks?: string[];
  mcpServers?: Record<string, unknown>;
}

function extractCapabilities(manifest: PluginJson): { type: string; name: string; description: string }[] {
  const caps: { type: string; name: string; description: string }[] = [];

  if (manifest.commands) {
    for (const cmd of manifest.commands) {
      const name = path.basename(cmd, ".md");
      caps.push({ type: "command", name, description: `/${name} command` });
    }
  }

  if (manifest.agents) {
    for (const agent of manifest.agents) {
      const name = path.basename(agent, ".md");
      caps.push({ type: "agent", name, description: `${name} subagent` });
    }
  }

  if (manifest.skills) {
    for (const skill of manifest.skills) {
      const name = path.basename(skill, ".md");
      caps.push({ type: "skill", name, description: `${name} skill` });
    }
  }

  if (manifest.hooks) {
    for (const hook of manifest.hooks) {
      const name = path.basename(hook, ".json");
      caps.push({ type: "hook", name, description: `${name} event hook` });
    }
  }

  if (manifest.mcpServers) {
    for (const serverName of Object.keys(manifest.mcpServers)) {
      caps.push({ type: "mcp", name: serverName, description: `${serverName} MCP server` });
    }
  }

  return caps;
}

async function seed() {
  const pluginsDir = path.resolve(__dirname, "../../plugins");

  if (!fs.existsSync(pluginsDir)) {
    console.error(`Plugins directory not found: ${pluginsDir}`);
    process.exit(1);
  }

  const dirs = fs.readdirSync(pluginsDir).filter((d) => {
    return fs.statSync(path.join(pluginsDir, d)).isDirectory();
  });

  console.log(`Found ${dirs.length} plugin directories`);

  // Run schema creation
  const schemaPath = path.resolve(__dirname, "../src/lib/schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    await sql(schemaSql);
    console.log("Schema created/verified");
  }

  // Clear existing data (idempotent)
  await sql("DELETE FROM plugin_env_vars");
  await sql("DELETE FROM plugin_capabilities");
  await sql("DELETE FROM plugins");
  console.log("Cleared existing data");

  for (const dir of dirs) {
    const manifestPath = path.join(pluginsDir, dir, ".claude-plugin", "plugin.json");

    let manifest: PluginJson;
    if (fs.existsSync(manifestPath)) {
      const raw = fs.readFileSync(manifestPath, "utf-8");
      // Strip JS-style comments (some plugin.json files use them)
      const cleaned = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      manifest = JSON.parse(cleaned);
    } else {
      // Fallback for plugins without a manifest
      manifest = {
        name: dir,
        description: `${dir} plugin`,
        version: "1.0.0",
      };
      console.warn(`  No plugin.json for ${dir}, using defaults`);
    }

    const slug = dir;
    const category = CATEGORY_MAP[slug] || "utility";
    const name = manifest.name || dir;
    const description = manifest.description || `${dir} plugin`;
    const version = manifest.version || "1.0.0";
    const author = manifest.author || "AgentHaus Team";
    const homepage = manifest.homepage || "https://github.com/savethepolarbears/agenthaus-marketplace";
    const tags = manifest.tags || [category];
    const installCount = Math.floor(Math.random() * 500) + 50;

    // Insert plugin
    const rows = await sql(
      `INSERT INTO plugins (name, slug, description, version, category, author, homepage, tags, install_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [name, slug, description, version, category, author, homepage, tags, installCount]
    );

    const pluginId = rows[0].id;
    console.log(`  Inserted plugin: ${name} (${slug}) -> id=${pluginId}`);

    // Insert capabilities
    const caps = extractCapabilities(manifest);
    for (const cap of caps) {
      await sql(
        `INSERT INTO plugin_capabilities (plugin_id, type, name, description)
         VALUES ($1, $2, $3, $4)`,
        [pluginId, cap.type, cap.name, cap.description]
      );
    }
    if (caps.length > 0) {
      console.log(`    ${caps.length} capabilities`);
    }

    // Insert env vars
    const envVars = ENV_VAR_MAP[slug] || [];
    for (const ev of envVars) {
      await sql(
        `INSERT INTO plugin_env_vars (plugin_id, var_name, description, required)
         VALUES ($1, $2, $3, $4)`,
        [pluginId, ev.var_name, ev.description, true]
      );
    }
    if (envVars.length > 0) {
      console.log(`    ${envVars.length} env vars`);
    }
  }

  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
