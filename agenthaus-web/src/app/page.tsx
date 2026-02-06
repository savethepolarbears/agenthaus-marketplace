import {
  Terminal,
  Cloud,
  BookOpen,
  CheckSquare,
  Play,
  Database,
  Code2,
  Github,
  FileText,
  Rocket,
  Search,
  Zap,
  LayoutDashboard,
  Share2,
} from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  cat: string;
  icon: React.ElementType;
  desc: string;
}

const plugins: Plugin[] = [
  // Content
  {
    id: "social-media",
    name: "Social Media",
    cat: "Content",
    icon: Share2,
    desc: "Generate high-engagement posts for Twitter, LinkedIn, Instagram & Facebook",
  },
  // DevOps
  {
    id: "github-integration",
    name: "GitHub Integration",
    cat: "DevOps",
    icon: Github,
    desc: "Manage GitHub issues and PRs via MCP server",
  },
  {
    id: "cloudflare-platform",
    name: "Cloudflare Platform",
    cat: "Cloud",
    icon: Cloud,
    desc: "Deploy Workers, manage KV storage & AI Gateway",
  },
  {
    id: "vercel-deploy",
    name: "Vercel Deploy",
    cat: "Deployment",
    icon: Rocket,
    desc: "Manage Vercel projects and deployments",
  },
  {
    id: "devops-flow",
    name: "DevOps Flow",
    cat: "Infra",
    icon: Zap,
    desc: "Cloudflare + GitHub + Slack integrations with hooks",
  },
  // Knowledge
  {
    id: "notion-workspace",
    name: "Notion Workspace",
    cat: "Knowledge",
    icon: FileText,
    desc: "Search and update Notion pages via MCP",
  },
  {
    id: "context7-docs",
    name: "Context7 Docs",
    cat: "Docs",
    icon: Search,
    desc: "Fetch hallucination-free library documentation",
  },
  {
    id: "knowledge-synapse",
    name: "Knowledge Synapse",
    cat: "RAG",
    icon: BookOpen,
    desc: "Context7 + Notion + Google Drive RAG system",
  },
  // Productivity
  {
    id: "clickup-tasks",
    name: "ClickUp Tasks",
    cat: "Productivity",
    icon: CheckSquare,
    desc: "Manage ClickUp tasks, lists and time tracking",
  },
  {
    id: "task-commander",
    name: "Task Commander",
    cat: "Productivity",
    icon: LayoutDashboard,
    desc: "ClickUp + Slack + Gmail + Calendar integration",
  },
  // Testing
  {
    id: "playwright-testing",
    name: "Playwright Testing",
    cat: "QA",
    icon: Play,
    desc: "E2E browser tests with QA engineer agent",
  },
  {
    id: "qa-droid",
    name: "QA Droid",
    cat: "Testing",
    icon: Play,
    desc: "Automated testing with Slack/Gmail notifications",
  },
  // Database
  {
    id: "neon-db",
    name: "Neon DB",
    cat: "Database",
    icon: Database,
    desc: "Serverless Postgres via MCP",
  },
  {
    id: "data-core",
    name: "Data Core",
    cat: "Database",
    icon: Database,
    desc: "Advanced Neon/Postgres with migrations",
  },
  // Utility
  {
    id: "marketplace-cli",
    name: "Marketplace CLI",
    cat: "Utility",
    icon: Code2,
    desc: "CLI utilities for managing AgentHaus plugins",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] text-white font-sans selection:bg-cyan-500/30">
      <nav className="border-b border-white/10 p-6 flex justify-between bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Terminal size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AgentHaus
          </span>
        </div>
        <div className="flex gap-6 text-sm text-gray-400 items-center">
          <span className="hover:text-cyan-400 cursor-pointer transition-colors">Registry</span>
          <span className="hover:text-cyan-400 cursor-pointer transition-colors">Docs</span>
          <span className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 cursor-pointer transition-all text-cyan-400">
            Submit Plugin
          </span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-6xl font-extrabold mb-6 text-center bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent leading-tight">
          Dock your agents.<br />Extend your intelligence.
        </h1>
        <p className="text-gray-400 text-center text-xl mb-12 max-w-2xl mx-auto">
          15 production-ready plugins for Claude Code and Cowork. Install in seconds.
        </p>
        
        <div className="flex justify-center mb-16">
          <div className="bg-gradient-to-r from-white/5 to-white/10 border border-white/10 px-6 py-4 rounded-xl font-mono text-cyan-400 flex gap-3 shadow-xl shadow-cyan-500/5 hover:shadow-cyan-500/10 transition-shadow">
            <span className="text-gray-500">$</span>
            <span>/plugin marketplace add https://github.com/agenthaus/marketplace</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((p) => (
            <div
              key={p.id}
              className="group bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-2xl hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                  <p.icon className="text-cyan-400" size={22} />
                </div>
                <span className="text-xs font-mono bg-black/50 px-3 py-1.5 rounded-lg text-gray-400 border border-white/5">
                  {p.cat}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-400 transition-colors">{p.name}</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">{p.desc}</p>
              <div className="bg-black/80 p-3 rounded-lg text-xs font-mono text-gray-500 border border-white/5 group-hover:border-cyan-500/20 transition-colors">
                /plugin install {p.id}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          © 2026 AgentHaus Team. Built for Claude Code & Cowork.
        </div>
      </footer>
    </div>
  );
}
