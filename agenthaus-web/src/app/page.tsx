import Link from "next/link";
import { sql } from "@/lib/db";
import { STATIC_PLUGINS } from "@/lib/plugins-static";
import type { StaticPlugin } from "@/lib/plugins-static";
import PluginGrid from "@/components/plugin-grid";
import Navbar from "@/components/navbar";
import { CommandCopy } from "@/components/command-copy";
import { unstable_cache } from "next/cache";

// Helper to strip unused fields from static plugins
// Bolt ⚡ Optimization: Strip capabilities and env_vars to reduce hydration payload size
const getStaticPlugins = () => {
  return STATIC_PLUGINS.map((p) => ({
    ...p,
    capabilities: [],
    env_vars: [],
  }));
};

function guessIcon(slug: string): string {
  const map: Record<string, string> = {
    "social-media": "Share2",
    "github-integration": "Github",
    "cloudflare-platform": "Cloud",
    "vercel-deploy": "Rocket",
    "devops-flow": "Zap",
    "notion-workspace": "FileText",
    "context7-docs": "Search",
    "knowledge-synapse": "BookOpen",
    "clickup-tasks": "CheckSquare",
    "task-commander": "LayoutDashboard",
    "playwright-testing": "Play",
    "qa-droid": "Play",
    "neon-db": "Database",
    "data-core": "Database",
    "marketplace-cli": "Code2",
    "ux-ui": "Palette",
    "agent-handoff": "GitBranch",
    "circuit-breaker": "ShieldAlert",
    "agent-memory": "Brain",
    "shadow-mode": "Eye",
    "fleet-commander": "Network",
    "plugin-auditor": "Shield",
    "openclaw-bridge": "Plug",
  };
  return map[slug] || "Package";
}

const fetchPluginsFromDB = async () => {
  if (!sql) throw new Error("No database connection");

  const rows = await sql`
      SELECT p.*
      FROM plugins p
      ORDER BY p.install_count DESC, p.name
    `;

  if (rows.length === 0) return getStaticPlugins();

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    version: r.version,
    category: r.category,
    author: r.author,
    tags: r.tags || [],
    install_count: r.install_count,
    icon: r.icon || guessIcon(r.slug),
    // Bolt ⚡ Optimization: Don't fetch capabilities for list view
    // This avoids expensive JOIN/GROUP BY operations on the main page
    capabilities: [],
    env_vars: [],
  }));
};

// Bolt ⚡ Optimization: Cache DB results to avoid round trips
// Revalidate every hour
const getCachedPluginsFromDB = unstable_cache(
  fetchPluginsFromDB,
  ["plugins-list"],
  { revalidate: 3600, tags: ["plugins"] }
);

async function getPlugins(): Promise<StaticPlugin[]> {
  if (!sql) return getStaticPlugins();

  try {
    return await getCachedPluginsFromDB();
  } catch (error) {
    console.error("Failed to fetch plugins from DB:", error);
    return getStaticPlugins();
  }
}

function getCategories(plugins: StaticPlugin[]): string[] {
  const cats = Array.from(new Set(plugins.map((p) => p.category))).sort();
  return ["all", ...cats];
}

export default async function Home() {
  const plugins = await getPlugins();
  const categories = getCategories(plugins);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] text-white font-sans selection:bg-cyan-500/30">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-24">
        <h1 className="text-6xl font-extrabold mb-6 text-center bg-linear-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent leading-tight">
          Dock your agents.
          <br />
          Extend your intelligence.
        </h1>
        <p className="text-gray-400 text-center text-xl mb-12 max-w-2xl mx-auto">
          23 production-ready plugins for Claude Code and Cowork. Install in
          seconds.
        </p>

        <div className="flex justify-center mb-16">
          <CommandCopy command="/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace" />
        </div>

        <PluginGrid plugins={plugins} categories={categories} />
      </main>

      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          &copy; 2026 AgentHaus Team. Built for Claude Code & Cowork.
        </div>
      </footer>
    </div>
  );
}
