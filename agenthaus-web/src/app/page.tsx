import { Terminal } from "lucide-react";
import { sql } from "@/lib/db";
import { STATIC_PLUGINS } from "@/lib/plugins-static";
import type { StaticPlugin } from "@/lib/plugins-static";
import PluginGrid from "@/components/plugin-grid";
import { CommandCopy } from "@/components/command-copy";

async function getPlugins(): Promise<StaticPlugin[]> {
  if (!sql) return STATIC_PLUGINS;

  try {
    const rows = await sql`
      SELECT p.*
      FROM plugins p
      ORDER BY p.install_count DESC, p.name
    `;

    if (rows.length === 0) return STATIC_PLUGINS;

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
  } catch {
    return STATIC_PLUGINS;
  }
}

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

function getCategories(plugins: StaticPlugin[]): string[] {
  const cats = Array.from(new Set(plugins.map((p) => p.category))).sort();
  return ["all", ...cats];
}

export default async function Home() {
  const plugins = await getPlugins();
  const categories = getCategories(plugins);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] text-white font-sans selection:bg-cyan-500/30">
      <nav className="border-b border-white/10 p-6 flex justify-between bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Terminal size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AgentHaus
          </span>
        </div>
        <div className="flex gap-6 text-sm text-gray-400 items-center">
          <span className="hover:text-cyan-400 cursor-pointer transition-colors">
            Registry
          </span>
          <span className="hover:text-cyan-400 cursor-pointer transition-colors">
            Docs
          </span>
          <span className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 cursor-pointer transition-all text-cyan-400">
            Submit Plugin
          </span>
        </div>
      </nav>

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
