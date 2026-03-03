export const GUESS_ICON_MAP: Record<string, string> = {
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

export function guessIcon(slug: string): string {
  return GUESS_ICON_MAP[slug] || "Package";
}
